/**
 * The people directory - one screen per role, matching mm.html.
 *
 * Everyone can read the directory: the Money In picker needs to look a giver up.
 * Only a secretary or an administrator can change it, so for an accountant this
 * screen drops its Add form and its Delete links rather than offering buttons
 * that would be refused. The server refuses them either way.
 *
 * The email column is empty for most rows because most people are not emailed:
 * only suppliers, employees and users are, and those three refuse to save
 * without an address. That rule spans two fields - a member promoted to supplier
 * has to gain an address - so it is enforced where the record as a whole is
 * valid, not here in the form.
 */

import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { peopleApi } from '@/api/endpoints'
import type { Person } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { DeleteLink, Field, FormGrid, Select, SubmitButton, TextInput } from '@/components/form'
import { SearchBox } from '@/components/SearchBox'
import { Async, DataTable, PageHeader, Panel } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useDebounced, useMutation, useQuery } from '@/hooks/useQuery'
import {
  EMAIL_REQUIRED_PERSON_ROLES,
  MEMBER_CATEGORIES,
  PERSON_ROLES,
  type PersonRoleName,
} from '@/lib/constants'
import { can } from '@/lib/permissions'

export function PeoplePage() {
  const params = useParams<{ role: string }>()
  const raw = params.role ?? 'Member'
  const role = (PERSON_ROLES.find((name) => name === raw) ?? 'Member') as PersonRoleName
  const label = `${role}s`
  const isMember = role === 'Member'
  /** These three are the roles the church always writes to. */
  const needsEmail = EMAIL_REQUIRED_PERSON_ROLES.includes(role)
  const { user } = useAuth()
  const canManage = can(user, 'people:manage')
  const toast = useToast()

  const [version, setVersion] = useState(0)
  const bump = () => setVersion((value) => value + 1)

  /** One box for the whole directory: name, phone or email address. */
  const [term, setTerm] = useState('')
  const search = useDebounced(term.trim(), 250)

  const state = useQuery(
    () => peopleApi.list({ role, limit: 1000, ...(search ? { search } : {}) }),
    [role, search, version],
  )

  const create = useMutation(
    (payload: { name: string; phone: string; email: string; category: string; notes: string }) =>
      peopleApi.create({
        role,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        category: payload.category,
        notes: payload.notes,
      }),
    () => {
      bump()
      toast('Saved')
    },
  )

  const remove = useMutation(
    (id: string) => peopleApi.remove(id),
    () => {
      bump()
      toast('Deleted')
    },
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Held onto before the round trip: React empties `currentTarget` as soon as
    // the handler returns, so by the time the save comes back there would be no
    // form left to clear.
    const element = event.currentTarget
    const form = new FormData(element)
    const name = String(form.get('name') ?? '').trim()
    if (!name) {
      toast('Please enter a name')
      return
    }
    // Asked for here so the reason is visible before the round trip. The server
    // refuses the same thing, because it is the only place that sees both fields.
    const email = String(form.get('email') ?? '').trim()
    if (needsEmail && email === '') {
      toast(`A ${role.toLowerCase()} needs an email address`)
      return
    }
    void create
      .run({
        name,
        phone: String(form.get('phone') ?? ''),
        email,
        category: isMember ? String(form.get('category') ?? '') : '',
        notes: String(form.get('notes') ?? ''),
      })
      .then((result) => {
        // Cleared only on success: if the name is already in the directory, the
        // details typed alongside it are still what the secretary wants to keep
        // while she goes to use the existing entry.
        if (result !== null) element.reset()
        else toast(create.getError() ?? 'Could not save')
      })
  }

  function handleDelete(person: Person) {
    if (!window.confirm(`Delete ${person.name}?`)) return
    void remove.run(person.id).then((result) => {
      if (result === null) toast(remove.getError() ?? 'Could not delete')
    })
  }

  return (
    <>
      <PageHeader icon="directory" title={label} />

      {canManage ? (
        <Panel title={`Add ${role}`}>
          <div className="mt-2.5">
            <FormGrid onSubmit={handleSubmit}>
              <Field label="Full Name">
                {(id) => <TextInput id={id} name="name" required />}
              </Field>
              <Field label="Phone">
                {(id) => <TextInput id={id} name="phone" />}
              </Field>
              <Field label={needsEmail ? 'Email *' : 'Email'}>
                {(id) => (
                  <TextInput id={id} name="email" type="text" required={needsEmail} />
                )}
              </Field>
              {isMember ? (
                <Field label="Category">
                  {(id) => <Select id={id} name="category" options={MEMBER_CATEGORIES} />}
                </Field>
              ) : null}
              <Field label="Notes">
                {(id) => <TextInput id={id} name="notes" />}
              </Field>
              <div>
                <SubmitButton pending={create.pending}>Save</SubmitButton>
              </div>
            </FormGrid>
          </div>
        </Panel>
      ) : null}

      <Panel title={`Search ${label.toLowerCase()}`}>
        <div className="mt-1">
          <SearchBox
            value={term}
            onChange={setTerm}
            placeholder="Search by name, phone or email"
          />
          <p className="mt-1 text-[11px] text-muted">
            {search ? `Showing matches for “${search}”.` : 'Showing everyone on this tab.'}
          </p>
        </div>
      </Panel>

      <Async state={state}>
        {(data) => (
          <DataTable
            rows={data}
            rowKey={(row) => row.id}
            emptyMessage={search ? `Nothing matches “${search}”` : `No ${label.toLowerCase()} yet`}
            columns={[
              { key: 'name', header: 'Name', render: (row) => row.name },
              { key: 'phone', header: 'Phone', render: (row) => row.phone || '' },
              {
                key: 'email',
                header: 'Email',
                render: (row) => row.email || <span className="text-muted">—</span>,
              },
              ...(isMember
                ? [
                    {
                      key: 'category',
                      header: 'Category',
                      render: (row: Person) => row.category || '',
                    },
                  ]
                : []),
              { key: 'notes', header: 'Notes', render: (row) => row.notes || '' },
              ...(canManage
                ? [
                    {
                      key: 'actions',
                      header: '',
                      render: (row: Person) => <DeleteLink onClick={() => handleDelete(row)} />,
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Async>
    </>
  )
}