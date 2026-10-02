/**
 * Money In and Money Out.
 *
 * One component covers all twelve of mm.html's entry screens: the route decides
 * the direction and which category is pre-selected, and `all` lists everything
 * in that direction.
 *
 * The two directions differ in one important way. Money Out names who was paid,
 * and that is free text - a power company, a mason, a supplier that may not be in
 * the directory at all. Money In names who gave, and a giver must be someone in the
 * directory, so that box is a picker rather than a text field. The server enforces
 * both; this only saves the mistake.
 *
 * Every attempt to save ends in a toast, the successful ones and the refused ones
 * alike. Each entry also carries a token from its form, so a second Save is the
 * same save rather than a second row of money.
 */

import { useMemo, useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { peopleApi, reportsApi, transactionsApi } from '@/api/endpoints'
import type { Account, Person, Transaction } from '@/api/types'
import { PartyField } from '@/components/PartyField'
import { PersonField } from '@/components/PersonField'
import { SearchBox } from '@/components/SearchBox'
import { DeleteLink, Field, FormGrid, Select, SubmitButton, TextInput } from '@/components/form'
import { Async, DataTable, PageHeader, Panel } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useDebounced, useMutation, useQuery } from '@/hooks/useQuery'
import { ACCOUNTS, CATS_IN, CATS_OUT, FUNDS, PAGE_SIZE } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'
import { newRequestId } from '@/lib/requestId'

type Direction = 'income' | 'expense'

const CATEGORIES: Record<Direction, readonly string[]> = {
  income: CATS_IN,
  expense: CATS_OUT,
}

export function MoneyPage({ direction }: { direction: Direction }) {
  const params = useParams<{ category: string }>()
  const selected = params.category ?? 'all'
  const isAll = selected === 'all'
  const categories = CATEGORIES[direction]
  const label = direction === 'income' ? 'Money In' : 'Money Out'
  const accent = direction === 'income' ? 'pos' : 'neg'
  const toast = useToast()

  /** Bumped after a write so the list refetches. */
  const [version, setVersion] = useState(0)
  const bump = () => setVersion((value) => value + 1)

  /** Free-text search over the list: a giver's name, a note, a supplier. */
  const [term, setTerm] = useState('')
  const search = useDebounced(term.trim(), 250)

  const state = useQuery(
    () =>
      transactionsApi.list({
        type: direction,
        ...(isAll ? {} : { category: selected }),
        ...(search ? { search } : {}),
        limit: PAGE_SIZE,
        order: 'desc',
      }),
    [direction, selected, search, version],
  )

  // The whole directory, to suggest names in the "Paid to" box. Only the Money Out
  // form has that box: Money In picks from the directory as you type instead, so
  // downloading a thousand rows to feed a suggestion list would be wasted.
  const peopleState = useQuery(() => peopleApi.list({ limit: 1000 }), [], direction === 'expense')

  // The table below is capped at PAGE_SIZE, so the "Total:" line reads the
  // server's own per-category totals rather than summing the visible rows.
  const summaryState = useQuery(() => reportsApi.summary(), [])
  const total = useMemo(() => {
    const summary = summaryState.data
    if (!summary) return null
    const byCategory =
      direction === 'income' ? summary.income_by_category : summary.expense_by_category
    if (isAll) {
      return direction === 'income' ? summary.total_income : summary.total_expenses
    }
    return byCategory.find((row) => row.category === selected)?.total ?? '0'
  }, [summaryState.data, direction, isAll, selected])

  const names = useMemo(
    () => (peopleState.data ?? []).map((person: Person) => person.name),
    [peopleState.data],
  )

  /**
   * This form's token for the entry being typed. It stays the same until an
   * entry is actually written, so pressing Save twice - or pressing it again
   * after the reply was lost - is recognised by the server as the same save and
   * returns the one entry instead of writing a second.
   */
  const requestId = useRef(newRequestId())

  const create = useMutation(
    (payload: {
      category: string
      party: string
      personId: string
      amount: number
      fund: string
      account: Account
      notes: string
      date: string
      clientRequestId: string
    }) =>
      transactionsApi.create({
        type: direction,
        category: payload.category,
        ...(direction === 'income'
          ? { person_id: payload.personId }
          : { party: payload.party }),
        amount: payload.amount,
        fund: payload.fund,
        account: payload.account,
        notes: payload.notes,
        date: payload.date,
        client_request_id: payload.clientRequestId,
      }),
    () => {
      // Written. The next entry is a different one and needs its own token.
      requestId.current = newRequestId()
      bump()
      toast('Saved')
    },
  )

  const remove = useMutation(
    (id: string) => transactionsApi.remove(id),
    () => {
      bump()
      toast('Deleted')
    },
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const date = String(form.get('date') ?? '')
    const amount = toNumber(String(form.get('amount') ?? ''))
    if (!date || !amount) {
      toast('Please enter a date and amount')
      return
    }
    // Money in is recorded against a person, so an untouched picker is refused
    // here with a reason the user can act on. The server refuses it too.
    const personId = String(form.get('person_id') ?? '')
    if (direction === 'income' && personId === '') {
      toast('Choose who gave, from the directory')
      return
    }
    // Money out names who was paid, in free text, because a power company is
    // not in the directory.
    const party = String(form.get('party') ?? '').trim()
    if (direction === 'expense' && party === '') {
      toast('Say who was paid')
      return
    }
    void create
      .run({
        category: String(form.get('category') ?? ''),
        party,
        personId,
        amount,
        fund: String(form.get('fund') ?? ''),
        account: String(form.get('account') ?? '') as Account,
        notes: String(form.get('notes') ?? ''),
        date,
        clientRequestId: requestId.current,
      })
      .then((result) => {
        if (result === null) toast(create.getError() ?? 'Could not save')
      })
  }

  function handleDelete(row: Transaction) {
    if (!window.confirm(`Delete this ${row.category} entry of ${money(row.amount)}?`)) return
    void remove.run(row.id).then((result) => {
      if (result === null) toast(remove.getError() ?? 'Could not delete')
    })
  }

  return (
    <>
      <PageHeader
        icon={direction === 'income' ? 'moneyIn' : 'moneyOut'}
        title={`${label}${!isAll ? ` — ${selected}` : ''}`}
        subtitle={
          <>
            Total: <b className={accent}>{money(total ?? 0)}</b>
          </>
        }
      />

      <Panel title={`Add ${direction === 'income' ? 'income' : 'expense'} entry`}>
        <div className="mt-2.5">
          <FormGrid onSubmit={handleSubmit}>
            <Field label="Date">
              {(id) => <TextInput id={id} name="date" type="date" required />}
            </Field>
            <Field label="Category">
              {(id) => (
                <Select
                  // `key` forces a remount when the route's category changes.
                  // `/in/Tithes` and `/in/Offerings` render this same component
                  // instance, so without it React reuses the DOM node and the
                  // stale `defaultValue` is never re-applied - the heading would
                  // say Offerings while the entry saved as a Tithes one.
                  key={selected}
                  id={id}
                  name="category"
                  options={categories}
                  defaultValue={isAll ? categories[0] : selected}
                />
              )}
            </Field>
            {direction === 'income' ? (
              <PersonField name="person_id" label="From (person)" />
            ) : (
              <PartyField name="party" label="Paid to" suggestions={names} />
            )}
            <Field label="Amount (KSh)">
              {(id) => <TextInput id={id} name="amount" type="number" min={0} step={1} required />}
            </Field>
            <Field label="Fund">
              {(id) => <Select id={id} name="fund" options={FUNDS} />}
            </Field>
            <Field label="Account">
              {(id) => <Select id={id} name="account" options={ACCOUNTS} />}
            </Field>
            <Field label="Notes">
              {(id) => <TextInput id={id} name="notes" />}
            </Field>
            <div>
              <SubmitButton pending={create.pending}>Save Entry</SubmitButton>
            </div>
          </FormGrid>
        </div>
      </Panel>

      <Panel title="Search this list">
        <div className="mt-1">
          <SearchBox
            value={term}
            onChange={setTerm}
            placeholder={
              direction === 'income'
                ? 'Search by name, or part of a name — or by a note'
                : 'Search by supplier, or by a note'
            }
          />
          <p className="mt-1 text-[11px] text-muted">
            {search
              ? `Showing entries matching “${search}”.`
              : `Showing the ${PAGE_SIZE} most recent.`}
          </p>
        </div>
      </Panel>

      <Async state={state}>
        {(data) => (
          <DataTable
            rows={data}
            rowKey={(row) => row.id}
            emptyMessage={search ? `Nothing matches “${search}”` : 'No entries yet'}
            columns={[
              { key: 'date', header: 'Date', render: (row) => row.date },
              { key: 'category', header: 'Category', render: (row) => row.category },
              {
                key: 'party',
                header: direction === 'income' ? 'From' : 'To',
                render: (row) => row.party || '',
              },
              { key: 'fund', header: 'Fund', render: (row) => row.fund || '' },
              { key: 'account', header: 'Account', render: (row) => row.account || '' },
              {
                key: 'amount',
                header: 'Amount',
                render: (row) => <span className={accent}>{money(row.amount)}</span>,
              },
              { key: 'notes', header: 'Notes', render: (row) => row.notes || '' },
              {
                key: 'actions',
                header: '',
                render: (row) => <DeleteLink onClick={() => handleDelete(row)} />,
              },
            ]}
          />
        )}
      </Async>
    </>
  )
}
