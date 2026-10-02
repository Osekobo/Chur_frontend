/**
 * The search box used above the listings: directory tabs, the Money In and Money
 * Out lists, the ledger, and the contribution search on Reports.
 *
 * One component so that every list in the app searches the same way - same box,
 * same placeholder shape, same "no match" wording - rather than each screen
 * growing its own slightly different copy.
 *
 * Typing is debounced by the caller, not here, because each screen decides how long
 * to wait and what to ask the server for once it does.
 */

import { useId } from 'react'

export function SearchBox({
  value,
  onChange,
  placeholder,
  label,
  autoFocus = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label?: string
  autoFocus?: boolean
}) {
  // Generated rather than fixed, so two search boxes on one page - which the
  // Money In screen has the moment a panel is added - cannot share an id and
  // leave one label pointing at the other's input.
  const id = useId()
  return (
    <div>
      {label ? (
        <label className="mb-1 block text-[12px] font-medium text-ink" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <input
        id={id}
        type="search"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink"
      />
    </div>
  )
}