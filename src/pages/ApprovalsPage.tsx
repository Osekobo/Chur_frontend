/**
 * Money-out requests: the approval queue.
 *
 * The screen is built around one rule the server enforces: a *pending* request
 * has not happened yet. It appears in no balance, no report and no trial balance
 * until an administrator approves it, and approving is what writes the real
 * expense. So the wording here never says a request has been spent - it says it
 * has been requested - and the Approve button is labelled with the amount it is
 * about to commit.
 *
 * Anyone signed in may raise a request; only an accountant may decide one. The
 * buttons are hidden for everyone else, but the server refuses regardless.
 */

import { useState, type FormEvent } from 'react'

import { approvalsApi } from '@/api/endpoints'
import type { Account, Approval, ApprovalStatus } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Field, FormGrid, Select, SubmitButton, TextInput } from '@/components/form'
import { Async, Cards, Card, DataTable, PageHeader, Panel } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useMutation, useQuery } from '@/hooks/useQuery'
import { ACCOUNTS, CATS_OUT, FUNDS } from '@/lib/constants'
import { can } from '@/lib/permissions'

/**
 * A request is always money going out, so it takes the expense categories only.
 * The server rejects anything else — including income categories — so the dropdown
 * offers exactly what the schema will accept.
 */
const EXPENSE_CATEGORIES = CATS_OUT.filter((category) => category !== 'Percentage Deduction')

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'] as const

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function statusTone(status: ApprovalStatus): string {
  if (status === 'approved') return 'pos'
  if (status === 'rejected') return 'neg'
  return ''
}

function formatWhen(value: string | null): string {
  if (value === null) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export function ApprovalsPage() {
  const { user: me } = useAuth()
  const toast = useToast()
  const canDecide = can(me, 'approvals:decide')

  const [version, setVersion] = useState(0)
  const bump = () => setVersion((value) => value + 1)
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>('All')

  const list = useQuery(
    () =>
      approvalsApi.list(
        filter === 'All' ? {} : { status: filter.toLowerCase() as ApprovalStatus },
      ),
    [version, filter],
  )
  const counts = useQuery(() => approvalsApi.count(), [version])

  const create = useMutation(
    (payload: {
      category: string
      party: string
      amount: number
      fund: string
      account: Account
      notes: string
      date: string
    }) => approvalsApi.create(payload),
    () => {
      bump()
      toast('Request submitted for approval')
    },
  )

  const decide = useMutation(
    (payload: { id: string; action: 'approve' | 'reject'; note: string }) =>
      payload.action === 'approve'
        ? approvalsApi.approve(payload.id, payload.note)
        : approvalsApi.reject(payload.id, payload.note),
    (result) => {
      bump()
      toast(
        result.status === 'approved'
          ? `Approved — ${result.amount} recorded in Money Out`
          : 'Request rejected',
      )
    },
  )

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const amount = Number(form.get('amount'))
    const category = String(form.get('category') ?? '')

    if (!category) {
      toast('Please choose a category')
      return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast('Enter an amount greater than zero')
      return
    }

    void create
      .run({
        category,
        party: String(form.get('party') ?? '').trim(),
        amount,
        fund: String(form.get('fund') ?? ''),
        account: String(form.get('account') ?? 'Cash') as Account,
        notes: String(form.get('notes') ?? '').trim(),
        date: String(form.get('date') ?? today()),
      })
      .then((result) => {
        if (result !== null) {
          // Keep the category, account and date; clear what was specific to this bill.
          event.currentTarget?.reset()
        } else {
          toast(create.getError() ?? 'Could not submit the request')
        }
      })
  }

  /**
   * Confirmation doubles as the note field: rejection almost always needs a
   * reason, and an empty answer is a valid note for an approval the admin agrees
   * needs no explanation. Returns null when the prompt is dismissed, so a stray
   * Escape never records a decision.
   */
  function askForNote(request: Approval, action: 'approve' | 'reject'): string | null {
    return window.prompt(
      action === 'approve'
        ? `Approve ${request.amount} for ${request.category}?\n\n` +
            'This records the expense in Money Out immediately.'
        : `Reject the ${request.amount} for ${request.category} request?\n\n` +
            'A short reason helps whoever raised it. Press Cancel to abort.',
    )
  }

  function handleDecide(request: Approval, action: 'approve' | 'reject') {
    const entered = askForNote(request, action)
    // null means the prompt was dismissed, which is not a decision.
    if (entered === null) return

    void decide
      .run({ id: request.id, action, note: entered.trim() })
      .then((result) => {
        // 409 is the server refusing a request that was already decided - almost
        // always a second click landing while the first was in flight.
        if (result === null) toast(decide.getError() ?? 'Could not record that decision')
      })
  }

  return (
    <>
      <PageHeader
        icon="approvals"
        title="Approvals"
        subtitle="Ask for money to go out, and approve what is owed. A request changes nothing until it is approved — approving writes it to Money Out."
      />

      <Async state={counts}>
        {(summary) => (
          <Cards>
            <Card label="Pending" value={summary.pending} tone={summary.pending > 0 ? 'neg' : undefined} />
            <Card label="Approved" value={summary.approved} />
            <Card label="Rejected" value={summary.rejected} />
            <Card label="All Requests" value={summary.total} />
          </Cards>
        )}
      </Async>

      <Panel title="Request money out" className="mb-3">
        <div className="mt-2.5">
          <FormGrid onSubmit={handleCreate}>
            <Field label="Category">
              {(id) => <Select id={id} name="category" options={EXPENSE_CATEGORIES} />}
            </Field>
            <Field label="Amount">
              {(id) => (
                <TextInput
                  id={id}
                  name="amount"
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                />
              )}
            </Field>
            <Field label="Paid To">
              {(id) => <TextInput id={id} name="party" placeholder="Who is being paid" />}
            </Field>
            <Field label="From">
              {(id) => <Select id={id} name="account" options={ACCOUNTS} defaultValue="Cash" />}
            </Field>
            <Field label="Fund">
              {(id) => <Select id={id} name="fund" options={FUNDS} defaultValue="General Fund" />}
            </Field>
            <Field label="When">
              {(id) => <TextInput id={id} name="date" type="date" defaultValue={today()} />}
            </Field>
            <Field label="Notes">
              {(id) => <TextInput id={id} name="notes" placeholder="Why, or what for" />}
            </Field>
            <div>
              <SubmitButton pending={create.pending}>Request</SubmitButton>
            </div>
          </FormGrid>
        </div>
      </Panel>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-muted">Show</span>
        {STATUS_FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            className="ghost"
            style={filter === option ? { borderColor: 'var(--accent2)', fontWeight: 700 } : undefined}
            onClick={() => setFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <Async state={list}>
        {(requests) => (
          <DataTable
            rows={requests}
            rowKey={(row) => row.id}
            emptyMessage={
              filter === 'All'
                ? 'No requests yet — raise one above when money needs to go out.'
                : `No ${filter.toLowerCase()} requests.`
            }
            columns={[
              {
                key: 'date',
                header: 'Date',
                render: (row) => <span className="text-muted">{row.date}</span>,
              },
              {
                key: 'category',
                header: 'For',
                render: (row) => (
                  <span>
                    <span className="font-bold">{row.category}</span>
                    {row.party ? <span className="text-muted"> — {row.party}</span> : null}
                    {row.notes ? <div className="text-muted">{row.notes}</div> : null}
                  </span>
                ),
              },
              {
                key: 'amount',
                header: 'Amount',
                render: (row) => <span className="neg font-bold">{row.amount}</span>,
              },
              {
                key: 'from',
                header: 'From',
                render: (row) => (
                  <span className="text-muted">
                    {row.account}
                    {row.fund ? ` · ${row.fund}` : ''}
                  </span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <span className={statusTone(row.status)}>
                    {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                  </span>
                ),
              },
              {
                key: 'decision',
                header: 'Decision',
                render: (row) =>
                  row.status === 'pending' ? (
                    <span className="text-muted">—</span>
                  ) : (
                    <span className="text-muted">
                      {formatWhen(row.decided_at)}
                      {row.decision_note ? <div>{row.decision_note}</div> : null}
                      {row.transaction_id ? (
                        <div className="pos">Recorded in Money Out</div>
                      ) : null}
                    </span>
                  ),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => {
                  if (!row.is_pending) return null
                  // The decider is the accountant, not the person who asked. The
                  // row says so rather than showing buttons that would be refused.
                  if (!canDecide) {
                    return (
                      <span className="text-muted" title="Only an accountant can decide a request">
                        Awaiting an accountant
                      </span>
                    )
                  }
                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={decide.pending}
                        onClick={() => handleDecide(row, 'approve')}
                      >
                        Approve {row.amount}
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        disabled={decide.pending}
                        onClick={() => handleDecide(row, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  )
                },
              },
            ]}
          />
        )}
      </Async>

      <div className="soon mt-3">
        <b>A request is not a payment</b>
        Raising one does not move any balance. It only becomes part of the ledger when an
        accountant approves it, and the approval is recorded with the name of the person who
        asked and the person who authorised it.
      </div>
    </>
  )
}