/** Form controls, styled to match mm.html's `form.grid` layout. */

import type { ChangeEvent, FormEvent, ReactNode } from 'react'

/* ----------------------------------------------------------------- layout -- */

export function FormGrid({
  onSubmit,
  children,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}) {
  return (
    <form
      // `min()` keeps the track from demanding 140px of a 320px screen, which
      // would make the form scroll sideways instead of dropping to one column.
      className="grid grid-cols-[repeat(auto-fit,minmax(min(140px,100%),1fr))] items-end gap-2.5"
      onSubmit={onSubmit}
      // The browser's own validation stops the submit before React hears about
      // it, and its bubble is not this app's: nothing appears in the corner, and
      // on a form where the only complaint would be an empty box the page looks
      // as though Save did nothing. Every form here checks its own fields and
      // answers with a toast, which is the same message in the same place for
      // every kind of failure.
      noValidate
    >
      {children}
    </form>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: (id: string) => ReactNode
}) {
  const id = `f-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      {children(id)}
    </div>
  )
}

/* --------------------------------------------------------------- controls -- */

interface BaseProps {
  id: string
  name?: string
  required?: boolean
}

const controlClass =
  'w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink'

export function TextInput({
  id,
  name,
  required,
  type = 'text',
  value,
  defaultValue,
  placeholder,
  min,
  max,
  step,
  onChange,
}: BaseProps & {
  type?: 'text' | 'date' | 'number'
  value?: string
  defaultValue?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      required={required}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      onChange={onChange}
      className={controlClass}
    />
  )
}

/** An option whose stored value differs from the text shown to the user. */
export interface Choice {
  value: string
  label: string
}

export function Select({
  id,
  name,
  required,
  value,
  defaultValue,
  options,
  choices,
  disabled,
  onChange,
}: BaseProps & {
  value?: string
  defaultValue?: string
  /** Plain labels, for when every option's value is the same as its label. */
  options?: readonly string[]
  /** Explicit pairs, for when the value sent to the server is not the wording. */
  choices?: readonly Choice[]
  disabled?: boolean
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}) {
  const entries = choices ?? (options ?? []).map((label) => ({ value: label, label }))
  return (
    <select
      id={id}
      name={name}
      required={required}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      onChange={onChange}
      className={`${controlClass} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {entries.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </select>
  )
}

export function SubmitButton({ children, pending }: { children: ReactNode; pending?: boolean }) {
  return (
    <button type="submit" disabled={pending} className="disabled:opacity-60">
      {pending ? 'Saving…' : children}
    </button>
  )
}

/* ------------------------------------------------------------------ extras -- */

export function Pill({ direction }: { direction: 'income' | 'expense' }) {
  const isIncome = direction === 'income'
  return (
    <span className={`pill ${isIncome ? 'in' : 'out'}`}>{isIncome ? 'IN' : 'OUT'}</span>
  )
}

/** The red "Delete" link in the last column of the editable tables. */
export function DeleteLink({ onClick }: { onClick: () => void }) {
  return (
    <span
      className="del"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
    >
      Delete
    </span>
  )
}
