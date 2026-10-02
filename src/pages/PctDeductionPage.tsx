/**
 * Tithe % Deduction.
 *
 * The amount is never taken on trust from the browser: the server recomputes it
 * from the tithes actually recorded for that date in the chosen account. The live
 * figures below come from the preview endpoint so the form can update as you type.
 */

import { useState, type FormEvent } from 'react'

import { deductionsApi } from '@/api/endpoints'
import type { TitheScope, Transaction } from '@/api/types'
import { Field, FormGrid, Select, SubmitButton, TextInput } from '@/components/form'
import { Async, Card, Cards, DataTable, PageHeader, Panel } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useMutation, useDebounced, useQuery } from '@/hooks/useQuery'
import { ACCOUNTS } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'

/**
 * The account dropdown, with the extra "All" row the scope adds. The values must
 * match Account in app/enums.py plus the "all" literal in TitheScope.
 */
const SCOPES: readonly { value: TitheScope; label: string }[] = [
  ...ACCOUNTS.map((account) => ({ value: account as TitheScope, label: account })),
  { value: 'all', label: 'All' },
]

export function PctDeductionPage() {
  const toast = useToast()
  const [version, setVersion] = useState(0)
  const [date, setDate] = useState('')
  const [pct, setPct] = useState('')
  const [scope, setScope] = useState<TitheScope>('Cash')

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
    () => deductionsApi.preview(debouncedDate, debouncedPct, scope),
    [debouncedDate, debouncedPct, scope],
    debouncedDate !== '' && debouncedPct > 0,
  )

  const create = useMutation(
    (payload: { date: string; pct: number; account: TitheScope; notes: string }) =>
      deductionsApi.create(payload),
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
        account: scope,
        notes,
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

  const tithes = preview.data?.tithes_that_day
  const amount = preview.data?.deduction_amount
  const shares = preview.data?.shares ?? []
  const everywhere = scope === 'all'
  const scopeLabel = everywhere ? 'any account' : String(scope)

  return (
    <>
      <PageHeader
        icon="pctDeduction"
        title="Tithe % Deduction"
        subtitle={`Take a percentage off one Sunday's tithes - e.g. a diocese remittance. The dropdown picks which account the tithes were collected into: deducting from Cash takes its share of the collection, while All covers every account that held tithes that day and posts each account its own share. Only Tithes are ever read - Offerings, Donations and Welfare are untouched, and money moved between the church's own accounts is never counted. This creates real Money Out entries the moment you click Record, so it actually reduces the accounts it came from.`}
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
          <Field label="Deduct from Account">
            {(id) => (
              <Select
                id={id}
                name="account"
                value={scope}
                choices={SCOPES}
                onChange={(event) => setScope(event.target.value as TitheScope)}
              />
            )}
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
              label={
                everywhere
                  ? 'Tithes collected that Sunday (all accounts)'
                  : `Tithes collected that Sunday in ${scope}`
              }
              value={tithes === undefined ? money(0) : money(tithes)}
            />
            <Card
              label="Deduction amount"
              value={amount === undefined ? money(0) : money(amount)}
              tone="neg"
            />
          </Cards>
          {shares.length > 1 ? (
            <p className="mt-2 text-[13px] text-muted">
              Split between accounts:{' '}
              {shares
                .map((share) => `${share.account} ${money(share.deduction_amount)}`)
                .join(', ')}
              . Each account is reduced by its own share.
            </p>
          ) : null}
          {debouncedDate !== '' && debouncedPct > 0 && preview.error !== null ? (
            <div className="neg text-[13px]">{preview.error}</div>
          ) : null}
          {debouncedDate !== '' &&
          debouncedPct > 0 &&
          preview.error === null &&
          preview.data !== null &&
          Number(preview.data.tithes_that_day) === 0 ? (
            <div className="text-[13px]">
              No Tithes were collected in {scopeLabel} on that date, so there is nothing to
              deduct.
            </div>
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
                header: 'Tithes That Day',
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
