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

export function Select({
  id,
  name,
  required,
  value,
  defaultValue,
  options,
  onChange,
}: BaseProps & {
  value?: string
  defaultValue?: string
  options: readonly string[]
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      className={controlClass}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
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
