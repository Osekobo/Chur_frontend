/** The people directory — one screen per role, matching mm.html. */

import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'

import { peopleApi } from '@/api/endpoints'
import type { Person } from '@/api/types'
import { DeleteLink, Field, FormGrid, Select, SubmitButton, TextInput } from '@/components/form'
import { Async, DataTable, PageHeader, Panel } from '@/components/ui'
import { useToast } from '@/components/Toast'
import { useMutation, useQuery } from '@/hooks/useQuery'
import { MEMBER_CATEGORIES, PERSON_ROLES, type PersonRoleName } from '@/lib/constants'

export function PeoplePage() {
  const params = useParams<{ role: string }>()
  const raw = params.role ?? 'Member'
  const role = (PERSON_ROLES.find((name) => name === raw) ?? 'Member') as PersonRoleName
  const label = `${role}s`
  const isMember = role === 'Member'
  const toast = useToast()

  const [version, setVersion] = useState(0)
  const bump = () => setVersion((value) => value + 1)

  const state = useQuery(() => peopleApi.list({ role, limit: 1000 }), [role, version])

  const create = useMutation(
    (payload: { name: string; phone: string; category: string; notes: string }) =>
      peopleApi.create({
        role,
        name: payload.name,
        phone: payload.phone,
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
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    if (!name) {
      toast('Please enter a name')
      return
    }
    void create
      .run({
        name,
        phone: String(form.get('phone') ?? ''),
        category: isMember ? String(form.get('category') ?? '') : '',
        notes: String(form.get('notes') ?? ''),
      })
      .then((result) => {
        if (result === null) toast(create.getError() ?? 'Could not save')
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

      <Panel title={`Add ${role}`}>
        <div className="mt-2.5">
          <FormGrid onSubmit={handleSubmit}>
            <Field label="Full Name">
              {(id) => <TextInput id={id} name="name" required />}
            </Field>
            <Field label="Phone">
              {(id) => <TextInput id={id} name="phone" />}
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

      <Async state={state}>
        {(data) => (
          <DataTable
            rows={data}
            rowKey={(row) => row.id}
            emptyMessage={`No ${label.toLowerCase()} yet`}
            columns={[
              { key: 'name', header: 'Name', render: (row) => row.name },
              { key: 'phone', header: 'Phone', render: (row) => row.phone || '' },
              ...(isMember
                ? [{ key: 'category', header: 'Category', render: (row: Person) => row.category || '' }]
                : []),
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
