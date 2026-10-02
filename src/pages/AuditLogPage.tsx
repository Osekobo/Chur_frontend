/**
 * The audit trail — who did what, and when.
 *
 * This screen is read-only on purpose. Entries are appended by the handlers that
 * perform the work, never edited and never deleted, so what you read here is
 * exactly what was recorded at the time. That is the whole point: a log an
 * administrator can tidy is not evidence of anything.
 *
 * Only administrators reach this screen. The server answers 403 to anyone else,
 * and the route is not even offered in the sidebar.
 */

import { useState } from 'react'

import { auditApi, type AuditListParams } from '@/api/endpoints'
import type { AuditAction, AuditEntity, AuditEntry } from '@/api/types'
import { Field, FormGrid, Select, TextInput } from '@/components/form'
import { Async, DataTable, PageHeader, Panel } from '@/components/ui'
import { useDebounced, useQuery } from '@/hooks/useQuery'
import { Icon } from '@/components/Icon'

/** Keep these in step with app/enums.py AuditAction. */
const ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'login_failed',
  'logout',
  'role_change',
  'password_reset',
  'account_deactivated',
  'account_reactivated',
  'approve',
  'reject',
] as const

/** Keep these in step with app/enums.py AuditEntity. */
const ENTITIES = ['transaction', 'person', 'user', 'auth', 'approval'] as const

const ALL = 'All'
const ACTION_CHOICES = [ALL, ...ACTIONS] as const
const ENTITY_CHOICES = [ALL, ...ENTITIES] as const

/** Readable labels; the stored values stay lowercase and stable. */
const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Created',
  update: 'Edited',
  delete: 'Deleted',
  login: 'Signed in',
  login_failed: 'Failed sign-in',
  logout: 'Signed out',
  role_change: 'Role changed',
  password_reset: 'Password reset',
  account_deactivated: 'Deactivated',
  account_reactivated: 'Reactivated',
  approve: 'Approved',
  reject: 'Rejected',
}

const ENTITY_LABELS: Record<AuditEntity, string> = {
  transaction: 'Money',
  person: 'Person',
  user: 'Account',
  auth: 'Sign-in',
  approval: 'Request',
}

/** Failed sign-ins and deactivations are the two worth spotting in a colour. */
function actionTone(action: AuditAction): string {
  if (action === 'login_failed' || action === 'account_deactivated' || action === 'delete') {
    return 'neg'
  }
  if (action === 'approve' || action === 'create' || action === 'login') return 'pos'
  return ''
}

function formatWhen(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function fieldList(changes: AuditEntry['changes']): [string, unknown][] {
  if (changes === null || typeof changes !== 'object') return []
  return Object.entries(changes)
}

/**
 * Values are stored as JSON, so anything can turn up: a string, a number, a
 * null. Render whatever came in rather than guessing at a type, and mark the
 * empty string so "cleared" does not look like "missing".
 */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (value === '') return '(empty)'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** One `field: before → after` line, the shape every edit produces. */
function renderChange([field, raw]: [string, unknown]): string {
  if (Array.isArray(raw) && raw.length === 2) {
    return `${field}: ${renderValue(raw[0])} → ${renderValue(raw[1])}`
  }
  return `${field}: ${renderValue(raw)}`
}

export function AuditLogPage() {
  const [version, setVersion] = useState(0)
  const [action, setAction] = useState<(typeof ACTION_CHOICES)[number]>(ALL)
  const [entity, setEntity] = useState<(typeof ENTITY_CHOICES)[number]>(ALL)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)

  // Typing in the search box should not fire a request per keystroke.
  const debouncedSearch = useDebounced(search, 300)
  const pageSize = 50

  const params: AuditListParams = {
    action: action === ALL ? undefined : action,
    entity: entity === ALL ? undefined : entity,
    search: debouncedSearch.trim() || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    page_size: pageSize,
  }

  const state = useQuery(() => auditApi.list(params), [version, page, action, entity, debouncedSearch, dateFrom, dateTo])

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      // Any change to the filters invalidates the current page number, otherwise
      // filtering down to a single page would show "page 4 of 1".
      setPage(1)
      setter(value)
    }
  }

  return (
    <>
      <PageHeader
        icon="auditTrail"
        title="Audit Log"
        subtitle="Every sign-in, change and approval, recorded as it happened. Entries are written by the app and can never be edited or deleted."
      />

      <Panel title="Filter" className="mb-3">
        <div className="mt-2.5">
          <FormGrid
            onSubmit={(event) => {
              event.preventDefault()
              setVersion((value) => value + 1)
            }}
          >
            <Field label="Action">
              {(id) => (
                <Select
                  id={id}
                  value={action}
                  options={ACTION_CHOICES}
                  onChange={(event) => resetPage(setAction)(event.target.value as (typeof ACTION_CHOICES)[number])}
                />
              )}
            </Field>
            <Field label="About">
              {(id) => (
                <Select
                  id={id}
                  value={entity}
                  options={ENTITY_CHOICES}
                  onChange={(event) => resetPage(setEntity)(event.target.value as (typeof ENTITY_CHOICES)[number])}
                />
              )}
            </Field>
            <Field label="Search">
              {(id) => (
                <TextInput
                  id={id}
                  value={search}
                  placeholder="Email, summary or id"
                  onChange={(event) => resetPage(setSearch)(event.target.value)}
                />
              )}
            </Field>
            <Field label="From">
              {(id) => (
                <TextInput
                  id={id}
                  type="date"
                  value={dateFrom}
                  onChange={(event) => resetPage(setDateFrom)(event.target.value)}
                />
              )}
            </Field>
            <Field label="To">
              {(id) => (
                <TextInput
                  id={id}
                  type="date"
                  value={dateTo}
                  onChange={(event) => resetPage(setDateTo)(event.target.value)}
                />
              )}
            </Field>
          </FormGrid>
        </div>
      </Panel>

      <Async state={state}>
        {(result) => (
          <>
            <DataTable
              rows={result.items}
              rowKey={(row) => row.id}
              emptyMessage="Nothing recorded for these filters."
              columns={[
                {
                  key: 'when',
                  header: 'When',
                  render: (row) => <span className="text-muted">{formatWhen(row.created_at)}</span>,
                },
                {
                  key: 'who',
                  header: 'Who',
                  render: (row) => (
                    <span>
                      <span className="font-bold">{row.actor_email || 'Unknown'}</span>
                      {row.ip_address ? <div className="text-muted">{row.ip_address}</div> : null}
                    </span>
                  ),
                },
                {
                  key: 'action',
                  header: 'Action',
                  render: (row) => (
                    <span className={actionTone(row.action)}>{ACTION_LABELS[row.action] ?? row.action}</span>
                  ),
                },
                {
                  key: 'about',
                  header: 'About',
                  render: (row) => <span className="text-muted">{ENTITY_LABELS[row.entity_type] ?? row.entity_type}</span>,
                },
                {
                  key: 'summary',
                  header: 'Details',
                  render: (row) => (
                    <span>
                      {row.summary}
                      {fieldList(row.changes).length > 0 ? (
                        <div className="text-muted">
                          {fieldList(row.changes)
                            .slice(0, 6)
                            .map(renderChange)
                            .join(' · ')}
                          {fieldList(row.changes).length > 6
                            ? ` · +${fieldList(row.changes).length - 6} more`
                            : ''}
                        </div>
                      ) : null}
                      {row.entity_id ? <div className="text-muted">id {row.entity_id}</div> : null}
                    </span>
                  ),
                },
              ]}
            />

            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                className="ghost"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <Icon name="previousPage" className="mr-1" />
                Newer
              </button>
              <span className="text-[13px] text-muted">
                Page {result.page} of {Math.max(1, result.pages)} · {result.total} entries
              </span>
              <button
                type="button"
                className="ghost"
                disabled={page >= result.pages}
                onClick={() => setPage((value) => Math.min(result.pages, value + 1))}
              >
                Older
                <Icon name="nextPage" className="ml-1" />
              </button>
            </div>
          </>
        )}
      </Async>

      <div className="soon mt-3">
        <b>This log cannot be edited</b>
        Nothing here can be changed or removed, not even by an administrator — that is what makes it
        usable when someone asks who changed a figure. A failed sign-in is recorded too, so a
        pattern of them is worth reading.
      </div>
    </>
  )
}
