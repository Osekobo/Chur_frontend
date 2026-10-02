/**
 * Money In and Money Out.
 *
 * One component covers all twelve of mm.html's entry screens: the route decides
 * the direction and which category is pre-selected, and `all` lists everything
 * in that direction.
 */

import { useMemo, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { peopleApi, reportsApi, transactionsApi } from '@/api/endpoints'
import type { Account, Person, Transaction } from '@/api/types'
import { PartyField } from '@/components/PartyField'
import { DeleteLink, Field, FormGrid, Select, SubmitButton, TextInput } from '@/components/form'
import { Async, DataTable, PageHeader, Panel } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useMutation, useQuery } from '@/hooks/useQuery'
import { ACCOUNTS, CATS_IN, CATS_OUT, FUNDS, PAGE_SIZE } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'

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

  const state = useQuery(
    () =>
      transactionsApi.list({
        type: direction,
        ...(isAll ? {} : { category: selected }),
        limit: PAGE_SIZE,
        order: 'desc',
      }),
    [direction, selected, version],
  )

  const peopleState = useQuery(() => peopleApi.list({ limit: 1000 }), [])

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

  const create = useMutation(
    (payload: {
      category: string
      party: string
      amount: number
      fund: string
      account: Account
      notes: string
      date: string
    }) =>
      transactionsApi.create({
        type: direction,
        category: payload.category,
        party: payload.party,
        amount: payload.amount,
        fund: payload.fund,
        account: payload.account,
        notes: payload.notes,
        date: payload.date,
      }),
    () => {
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
    void create
      .run({
        category: String(form.get('category') ?? ''),
        party: String(form.get('party') ?? ''),
        amount,
        fund: String(form.get('fund') ?? ''),
        account: String(form.get('account') ?? '') as Account,
        notes: String(form.get('notes') ?? ''),
        date,
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
            <PartyField
              name="party"
              label={direction === 'income' ? 'From (person)' : 'Paid to'}
              suggestions={names}
            />
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

      <Async state={state}>
        {(data) => (
          <DataTable
            rows={data}
            rowKey={(row) => row.id}
            emptyMessage="No entries yet"
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
