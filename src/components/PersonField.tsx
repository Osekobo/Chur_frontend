/**
 * Money In's giver field: pick somebody who is already in the directory.
 *
 * The old box took a typed-in name, which is how one person ended up in the ledger
 * as "A. Ochieng" on one Sunday and "Angela Ochieng" on the next. This one searches
 * the directory as you type and stores the person's id, so the entry belongs to a
 * person rather than to a spelling. The name shown afterwards is the directory's,
 * because that is the name the server copies into the ledger.
 *
 * There is no "add them here" escape hatch, deliberately. A giver who is not in the
 * directory is a directory entry the secretary has not made yet; inventing one from
 * the Money In screen would put it in the wrong place, and quietly. The hint under
 * the box says so instead of guessing.
 */

import { useEffect, useId, useRef, useState } from 'react'

import { peopleApi } from '@/api/endpoints'
import type { Person } from '@/api/types'
import { useDebounced, useQuery } from '@/hooks/useQuery'

/** Enough to recognise a person without turning the box into a directory listing. */
const SEARCH_LIMIT = 8

export function PersonField({ name, label }: { name: string; label: string }) {
  const listId = useId()
  const [term, setTerm] = useState('')
  const [chosen, setChosen] = useState<Person | null>(null)
  const [open, setOpen] = useState(false)
  const debounced = useDebounced(term.trim())

  // Nothing is asked of the server until there is something to ask about: an empty
  // search would return the whole directory, and the box is not a directory.
  const matches = useQuery(
    () => peopleApi.list({ search: debounced, limit: SEARCH_LIMIT }),
    [debounced],
    debounced.length > 0 && chosen === null,
  )

  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const results = matches.data ?? []
  const searching = matches.loading && debounced.length > 0
  const showList = open && debounced.length > 0 && chosen === null

  function pick(person: Person) {
    setChosen(person)
    setTerm('')
    setOpen(false)
  }

  function handleChange(value: string) {
    setTerm(value)
    setOpen(true)
    // Typing after picking means the shown name is no longer the picked person, so
    // the link has to go: submitting must not attach a giver the box no longer shows.
    setChosen(null)
  }

  return (
    <div ref={containerRef}>
      <label htmlFor={`f-${name}`}>{label}</label>
      <input
        id={`f-${name}`}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search the directory"
        value={chosen ? `${chosen.name}${chosen.phone ? ` · ${chosen.phone}` : ''}` : term}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => setOpen(true)}
        className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink"
      />
      {/*
        The form posts a name, and this is the one that carries the meaning: the id
        of the person. Left empty until somebody is actually chosen, so an untouched
        box cannot post an empty-string id that looks like a real value.
      */}
      <input type="hidden" name={name} value={chosen?.id ?? ''} />

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="mt-1 max-h-56 overflow-auto rounded-md border border-line bg-surface shadow-sm"
        >
          {results.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-baseline justify-between gap-2 px-2 py-1.5 text-left text-[13px] hover:bg-bg"
                onClick={() => pick(person)}
              >
                <span>{person.name}</span>
                <span className="shrink-0 text-[11px] text-muted">
                  {[person.role, person.phone].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
          {!searching && results.length === 0 ? (
            <li className="px-2 py-1.5 text-[12px] text-muted">
              Nobody in the directory matches “{debounced}”. Add them to the directory first,
              then pick them here.
            </li>
          ) : null}
        </ul>
      ) : null}

      {chosen ? (
        <p className="mt-1 text-[11px] text-muted">
          Recorded against {chosen.name}
          {chosen.email ? ` · ${chosen.email}` : ''}
        </p>
      ) : null}
    </div>
  )
}