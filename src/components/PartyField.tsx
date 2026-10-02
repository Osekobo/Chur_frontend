/**
 * Party / person input backed by a datalist.
 *
 * Matches mm.html, which offered every saved name as a suggestion but still
 * accepted a name that was not in the directory.
 */

import { useId } from 'react'

export function PartyField({
  name,
  label,
  placeholder = 'Name',
  suggestions,
  defaultValue,
  onChange,
}: {
  name: string
  label: string
  placeholder?: string
  suggestions: string[]
  defaultValue?: string
  onChange?: (value: string) => void
}) {
  const listId = useId()

  return (
    <div>
      <label htmlFor={`f-${name}`}>{label}</label>
      <input
        id={`f-${name}`}
        name={name}
        list={listId}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink"
      />
      <datalist id={listId}>
        {suggestions.map((name_) => (
          <option key={name_} value={name_} />
        ))}
      </datalist>
    </div>
  )
}
