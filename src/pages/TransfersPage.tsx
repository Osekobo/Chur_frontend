/** Transfers — moving money between Cash, Bank and M-PESA. */

import { useState, type FormEvent } from 'react'

import { transactionsApi } from '@/api/endpoints'
import type { Account, Transfer } from '@/api/types'
import { Field, FormGrid, Select, SubmitButton, TextInput } from '@/components/form'
import { Async, DataTable, PageHeader, Panel } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useMutation, useQuery } from '@/hooks/useQuery'
import { ACCOUNTS } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'

export function TransfersPage() {
  const toast = useToast()
  const [version, setVersion] = useState(0)

  const state = useQuery(
    () => transactionsApi.listTransfers(),
    [version],
  )

  const create = useMutation(
    (payload: {
      from_account: Account
      to_account: Account
      amount: number
      date: string
      notes: string
    }) => transactionsApi.createTransfer(payload),
    () => {
      setVersion((value) => value + 1)
      toast('Transfer recorded')
    },
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const date = String(form.get('date') ?? '')
    const amount = toNumber(String(form.get('amount') ?? ''))
    const from = String(form.get('from') ?? '') as Account
    const to = String(form.get('to') ?? '') as Account

    if (!date || !amount) {
      toast('Please enter a date and amount')
      return
    }
    if (from === to) {
      toast('Choose two different accounts')
      return
    }
    void create
      .run({ from_account: from, to_account: to, amount, date, notes: String(form.get('notes') ?? '') })
      .then((result) => {
        if (result === null) toast(create.getError() ?? 'Could not save')
      })
  }

  return (
    <>
      <PageHeader
        icon="transfers"
        title="Transfers"
        subtitle="Move money between Cash, Bank and M-PESA"
      />

      <Panel>
        <FormGrid onSubmit={handleSubmit}>
          <Field label="Date">
            {(id) => <TextInput id={id} name="date" type="date" required />}
          </Field>
          <Field label="From">
            {(id) => <Select id={id} name="from" options={ACCOUNTS} />}
          </Field>
          <Field label="To">
            {(id) => <Select id={id} name="to" options={ACCOUNTS} defaultValue={ACCOUNTS[1]} />}
          </Field>
          <Field label="Amount (KSh)">
            {(id) => <TextInput id={id} name="amount" type="number" min={0} required />}
          </Field>
          <Field label="Notes">
            {(id) => <TextInput id={id} name="notes" />}
          </Field>
          <div>
            <SubmitButton pending={create.pending}>Record Transfer</SubmitButton>
          </div>
        </FormGrid>
      </Panel>

      <Async state={state}>
        {(data) => (
          <DataTable
            rows={data}
            rowKey={(row: Transfer) => row.transfer_id}
            emptyMessage="No transfers yet"
            columns={[
              { key: 'date', header: 'Date', render: (row) => row.date },
              { key: 'from', header: 'From', render: (row) => row.from_account },
              { key: 'to', header: 'To', render: (row) => row.to_account },
              { key: 'amount', header: 'Amount', render: (row) => money(row.amount) },
              { key: 'notes', header: 'Notes', render: (row) => row.notes || '' },
            ]}
          />
        )}
      </Async>
    </>
  )
}
