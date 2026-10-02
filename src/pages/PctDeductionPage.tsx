/**
 * Tithe % Deduction.
 *
 * The amount is never taken on trust from the browser: the server recomputes it
 * from the collection actually recorded for that date and the chosen basis. The
 * live figures below come from the preview endpoint so the form can update as you
 * type.
 */

import { useState, type FormEvent } from 'react'

import { deductionsApi } from '@/api/endpoints'
import type { Account, DeductionBasis, Transaction } from '@/api/types'
import { Field, FormGrid, Select, SubmitButton, TextInput } from '@/components/form'
import { Async, Card, Cards, DataTable, PageHeader, Panel } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useMutation, useDebounced, useQuery } from '@/hooks/useQuery'
import { ACCOUNTS } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'

/** Must match the DeductionBasis values in app/enums.py. */
const BASES: readonly { value: DeductionBasis; label: string }[] = [
  { value: 'tithes', label: 'Tithes only' },
  { value: 'all', label: 'All money collected' },
]

export function PctDeductionPage() {
  const toast = useToast()
  const [version, setVersion] = useState(0)
  const [date, setDate] = useState('')
  const [pct, setPct] = useState('')
  const [basis, setBasis] = useState<DeductionBasis>('tithes')

  const history = useQuery(
    () => deductionsApi.history(),
    [version],
  )

  // The preview is only meaningful once both a date and a percentage are typed.
  // Debounced so typing "10" costs one request rather than one per keystroke.
  const pctValue = toNumber(pct)
  const debouncedDate = useDebounced(date, 250)
  const debouncedPct = useDebounced(pctValue, 250)
  const preview = useQuery(
    () => deductionsApi.preview(debouncedDate, debouncedPct, basis),
    [debouncedDate, debouncedPct, basis],
    debouncedDate !== '' && debouncedPct > 0,
  )

  const create = useMutation(
    (payload: {
      date: string
      pct: number
      account: Account
      notes: string
      basis: DeductionBasis
    }) => deductionsApi.create(payload),
    () => {
      setVersion((value) => value + 1)
      toast('Deduction recorded')
    },
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const chosen = String(form.get('date') ?? '')
    const percentage = toNumber(String(form.get('pct') ?? ''))
    const notes = String(form.get('notes') ?? '')

    if (!chosen) {
      toast("Please choose the Sunday's date")
      return
    }
    if (!percentage || percentage <= 0) {
      toast('Please enter a percentage greater than 0')
      return
    }
    void create
      .run({
        date: chosen,
        pct: percentage,
        account: String(form.get('account') ?? '') as Account,
        notes,
        basis,
      })
      .then((result) => {
        if (result === null) {
          toast(create.getError() ?? 'Could not save')
        } else {
          // Clear the whole form, not just the percentage. `useQuery` keeps the
          // last result while disabled, so leaving the date in place would keep
          // the two cards showing the figures just recorded.
          setPct('')
          setDate('')
        }
      })
  }

  const collected = preview.data?.collected_that_day
  const amount = preview.data?.deduction_amount
  const wholeDay = basis === 'all'

  return (
    <>
      <PageHeader
        icon="pctDeduction"
        title="Tithe % Deduction"
        subtitle="Take a percentage off what a Sunday brought in - e.g. a diocese remittance. Percentage Base decides what it comes off: Tithes only leaves Offerings, Donations and Welfare untouched, while All money collected takes it off every category recorded that day. Money moved between the church's own accounts is never counted. This creates a real Money Out entry the moment you click Record, so it actually reduces the account you choose."
      />

      <Panel>
        <FormGrid onSubmit={handleSubmit}>
          <Field label="Sunday Date">
            {(id) => (
              <TextInput
                id={id}
                name="date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            )}
          </Field>
          <Field label="Percentage to deduct (%)">
            {(id) => (
              <TextInput
                id={id}
                name="pct"
                type="number"
                min={0}
                max={100}
                step={0.1}
                required
                value={pct}
                onChange={(event) => setPct(event.target.value)}
              />
            )}
          </Field>
          <Field label="Percentage Base">
            {(id) => (
              <Select
                id={id}
                name="basis"
                value={basis}
                choices={BASES}
                onChange={(event) => setBasis(event.target.value as DeductionBasis)}
              />
            )}
          </Field>
          <Field label="Deduct from Account">
            {(id) => <Select id={id} name="account" options={ACCOUNTS} />}
          </Field>
          <Field label="Purpose / Notes">
            {(id) => (
              <TextInput id={id} name="notes" placeholder="e.g. Diocese remittance" />
            )}
          </Field>
          <div>
            <SubmitButton pending={create.pending}>Record This Deduction</SubmitButton>
          </div>
        </FormGrid>

        <div className="mt-3.5">
          <Cards>
            <Card
              label={wholeDay ? 'All money collected that Sunday' : 'Tithes collected that Sunday'}
              value={collected === undefined ? money(0) : money(collected)}
            />
            <Card
              label="Deduction amount"
              value={amount === undefined ? money(0) : money(amount)}
              tone="neg"
            />
          </Cards>
          {debouncedDate !== '' && debouncedPct > 0 && preview.error !== null ? (
            <div className="neg text-[13px]">{preview.error}</div>
          ) : null}
        </div>
      </Panel>

      <Async state={history}>
        {(data) => (
          <DataTable
            rows={data}
            rowKey={(row: Transaction) => row.id}
            emptyMessage="No deductions recorded yet"
            columns={[
              { key: 'date', header: 'Date', render: (row) => row.date },
              {
                key: 'pct',
                header: '%',
                render: (row) => (row.pct !== null ? `${toNumber(row.pct)}%` : ''),
              },
              {
                key: 'base',
                header: 'Collected That Day',
                render: (row) => money(row.base_total ?? 0),
              },
              {
                key: 'amount',
                header: 'Amount Deducted',
                render: (row) => <span className="neg">{money(row.amount)}</span>,
              },
              { key: 'account', header: 'Account', render: (row) => row.account },
              { key: 'notes', header: 'Notes', render: (row) => row.notes || '' },
            ]}
          />
        )}
      </Async>
    </>
  )
}
