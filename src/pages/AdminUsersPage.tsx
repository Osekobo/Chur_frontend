/**
 * User administration - the screen that assigns roles.
 *
 * Roles are not chosen anywhere else in the app. Public sign-up always produces
 * an accountant - the least privileged role - so this page (or the equivalent
 * UPDATE in psql) is the only way an account becomes a secretary or an
 * administrator.
 *
 * Two rules the screen mirrors from the server, because getting them wrong is
 * how an administrator locks everyone out:
 *
 *   - There is no delete. An account is deactivated instead, so the ledger keeps
 *     pointing at whoever recorded each transaction.
 *   - You cannot deactivate or change your own role. The server refuses it; the
 *     controls are disabled so the reason is visible before the round trip.
 *
 * What each role may do is not restated here. The server sends the answer with
 * the session (see `can` in lib/permissions.ts) and checks it again on every
 * request, so this page only has to choose which role to offer.
 */

import { useState, type FormEvent } from 'react'

import { usersApi } from '@/api/endpoints'
import type { User, UserRole } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Field, FormGrid, Select, SubmitButton, TextInput } from '@/components/form'
import { Async, Cards, Card, DataTable, PageHeader, Panel } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useMutation, useQuery } from '@/hooks/useQuery'
import { ROLE_LABELS, USER_ROLES } from '@/lib/permissions'

/** Offered in the create form, in the order a church office is likely to need them. */
const ROLE_CHOICES = USER_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))

/** Same rule as app/schemas/auth.py, checked before the request is sent. */
function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long.'
  if (!/[a-z]/i.test(password)) return 'Password must contain at least one letter.'
  if (!/\d/.test(password)) return 'Password must contain at least one number.'
  return null
}

function formatWhen(value: string | null): string {
  if (value === null) return 'Never'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export function AdminUsersPage() {
  const { user: me } = useAuth()
  const toast = useToast()

  const [version, setVersion] = useState(0)
  const bump = () => setVersion((value) => value + 1)

  const state = useQuery(() => usersApi.list(), [version])

  const create = useMutation(
    (payload: { email: string; full_name: string; password: string; role: UserRole }) =>
      usersApi.create(payload),
    () => {
      bump()
      toast('Account created')
    },
  )

  const update = useMutation(
    (payload: { id: string; body: { is_active?: boolean; role?: UserRole } }) =>
      usersApi.update(payload.id, payload.body),
    () => {
      bump()
      toast('Saved')
    },
  )

  const setPassword = useMutation(
    (payload: { id: string; new_password: string }) => usersApi.setPassword(payload.id, payload.new_password),
    () => toast('Password reset'),
  )

  const revokeSessions = useMutation((id: string) => usersApi.revokeSessions(id), () =>
    toast('Signed out of all sessions'),
  )

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const fullName = String(form.get('full_name') ?? '').trim()
    const password = String(form.get('password') ?? '')

    if (!email || !fullName) {
      toast('Please enter an email address and a name')
      return
    }
    const problem = passwordProblem(password)
    if (problem !== null) {
      toast(problem)
      return
    }

    void create
      .run({
        email,
        full_name: fullName,
        password,
        role: (form.get('role') as UserRole | null) ?? 'accountant',
      })
      .then((result) => {
        if (result !== null) event.currentTarget?.reset()
        else toast(create.getError() ?? 'Could not create the account')
      })
  }

  /** Reset a password from a prompt. The server validates the rules regardless. */
  function handleResetPassword(target: User) {
    const entered = window.prompt(
      `New password for ${target.full_name}.\nAt least 8 characters, including a letter and a number.`,
    )
    if (entered === null) return
    const problem = passwordProblem(entered)
    if (problem !== null) {
      toast(problem)
      return
    }
    void setPassword.run({ id: target.id, new_password: entered }).then((result) => {
      if (result === null) toast(setPassword.getError() ?? 'Could not reset the password')
    })
  }

  function handleToggleActive(target: User) {
    const deactivate = target.is_active
    const question = deactivate
      ? `Deactivate ${target.full_name}? They will be signed out immediately.`
      : `Reactivate ${target.full_name}?`
    if (!window.confirm(question)) return
    void update.run({ id: target.id, body: { is_active: !target.is_active } }).then((result) => {
      if (result === null) toast(update.getError() ?? 'Could not save')
    })
  }

  /**
   * Change somebody's role.
   *
   * Asked for rather than applied on change: the difference between a secretary
   * and an administrator is the whole of their authority, so a mis-click should
   * have to be confirmed. A refusal from the server (changing your own) leaves
   * the select showing what is actually stored once the list reloads.
   */
  function handleChangeRole(target: User, role: UserRole) {
    if (role === target.role) return
    const question = `Change ${target.full_name} from ${ROLE_LABELS[target.role]} to ${ROLE_LABELS[role]}?`
    if (!window.confirm(question)) return
    void update.run({ id: target.id, body: { role } }).then((result) => {
      if (result === null) toast(update.getError() ?? 'Could not save')
    })
  }

  function handleSignOutEverywhere(target: User) {
    if (!window.confirm(`Sign ${target.full_name} out of every device?`)) return
    void revokeSessions.run(target.id).then((result) => {
      if (result === null) toast(revokeSessions.getError() ?? 'Could not sign the user out')
    })
  }

  return (
    <>
      <PageHeader
        icon="administrationPanel"
        title="Users"
        subtitle="Assign roles and control who can sign in. Everyone sees the same church ledger, so a role only decides which jobs that account may do."
      />

      <Async state={state}>
        {(users) => (
          <>
            <Cards>
              <Card label="Accounts" value={users.length} />
              <Card label="Administrators" value={users.filter((u) => u.role === 'admin' && u.is_active).length} />
              <Card label="Sign-ins Today" value={users.filter((u) => u.last_login_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length} />
              <Card
                label="Deactivated"
                value={users.filter((u) => !u.is_active).length}
                tone={users.some((u) => !u.is_active) ? 'neg' : undefined}
              />
            </Cards>

            <Panel title="Create an account" className="mb-3">
              <div className="mt-2.5">
                <FormGrid onSubmit={handleCreate}>
                  <Field label="Email">
                    {(id) => <TextInput id={id} name="email" type="text" required />}
                  </Field>
                  <Field label="Full Name">
                    {(id) => <TextInput id={id} name="full_name" required />}
                  </Field>
                  <Field label="Password">
                    {(id) => (
                      <input
                        id={id}
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink"
                      />
                    )}
                  </Field>
                  <Field label="Role">
                    {(id) => (
                      <Select
                        id={id}
                        name="role"
                        defaultValue="accountant"
                        choices={ROLE_CHOICES}
                      />
                    )}
                  </Field>
                  <div>
                    <SubmitButton pending={create.pending}>Create</SubmitButton>
                  </div>
                </FormGrid>
              </div>
            </Panel>

            <DataTable
              rows={users}
              rowKey={(row) => row.id}
              emptyMessage="No accounts yet"
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (row) => (
                    <span>
                      <span className={row.is_active ? '' : 'text-muted line-through'}>{row.full_name}</span>
                      {row.id === me?.id ? <span className="text-muted"> (you)</span> : null}
                    </span>
                  ),
                },
                { key: 'email', header: 'Email', render: (row) => row.email },
                {
                  key: 'role',
                  header: 'Role',
                  render: (row) => (
                    <span className={row.role === 'admin' ? 'pos' : ''}>{row.role_label}</span>
                  ),
                },
                {
                  key: 'last_login',
                  header: 'Last sign-in',
                  render: (row) => <span className="text-muted">{formatWhen(row.last_login_at)}</span>,
                },
                {
                  key: 'actions',
                  header: '',
                  render: (row) => {
                    const isSelf = row.id === me?.id
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          id={`role-${row.id}`}
                          value={row.role}
                          choices={ROLE_CHOICES}
                          disabled={isSelf}
                          onChange={(event) => handleChangeRole(row, event.target.value as UserRole)}
                        />
                        <button
                          type="button"
                          className="ghost"
                          disabled={isSelf}
                          title={isSelf ? 'You cannot deactivate yourself' : undefined}
                          onClick={() => handleToggleActive(row)}
                        >
                          {row.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                        <button type="button" className="ghost" onClick={() => handleResetPassword(row)}>
                          Reset password
                        </button>
                        <button type="button" className="ghost" onClick={() => handleSignOutEverywhere(row)}>
                          Sign out
                        </button>
                      </div>
                    )
                  },
                },
              ]}
            />

            <div className="soon mt-3">
              <b>Accounts are never deleted</b>
              Deactivating keeps the ledger's history intact: each transaction still records who
              entered it. To remove a test account, deactivate it instead.
            </div>
          </>
        )}
      </Async>
    </>
  )
}