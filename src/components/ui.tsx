/**
 * The table, card and panel primitives shared by every screen.
 *
 * The class names and spacing come straight from mm.html so the pages render
 * the same as the original.
 */

import type { ReactNode } from 'react'

import { Icon } from '@/components/Icon'
import type { IconName } from '@/lib/icons'

/* ----------------------------------------------------------------- header -- */

/**
 * The title block every screen opens with.
 *
 * The icon sits in a tinted square rather than inline with the title, which keeps
 * the heading left-aligned with the table and card edges below it while still
 * giving each screen a quick visual identifier.
 */
export function PageHeader({
  icon,
  title,
  subtitle,
}: {
  icon: IconName
  title: string
  subtitle?: ReactNode
}) {
  return (
    <header className="mb-4 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent2/15 text-accent2">
        <Icon name={icon} className="text-[17px]" />
      </span>
      <div className="min-w-0">
        <h2 className="m-0 text-xl">{title}</h2>
        {subtitle ? <div className="mt-1 text-[13px] text-muted">{subtitle}</div> : null}
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ table -- */

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage: string
}

export function DataTable<T>({ columns, rows, rowKey, emptyMessage }: DataTableProps<T>) {
  return (
    <div className="table-scroll overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-lg border border-line bg-card">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-2.5 py-2 text-[13px] text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="last:[&>td]:border-b-0 [&>td]:border-b [&>td]:border-line">
                {columns.map((column) => (
                  <td key={column.key} className="px-2.5 py-2 text-left text-[13px]">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ cards -- */

export function Cards({ children }: { children: ReactNode }) {
  return <div className="mb-[18px] flex flex-wrap gap-3">{children}</div>
}

export function Card({ label, value, tone }: { label: string; value: ReactNode; tone?: 'pos' | 'neg' }) {
  return (
    <div className="card">
      <div className="lbl">{label}</div>
      <div className={`val ${tone ?? ''}`}>{value}</div>
    </div>
  )
}

/* ----------------------------------------------------------------- panel -- */

export function Panel({
  title,
  children,
  className = '',
}: {
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`panel ${className}`}>
      {title ? <b>{title}</b> : null}
      {children}
    </div>
  )
}

/** Two panels side by side, used by the dashboard and the reports page. */
export function PanelRow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-stretch gap-2.5">{children}</div>
  )
}

/* ------------------------------------------------------------------ state -- */

/** Shown in place of a table while the first load is in flight. */
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return <div className="soon">{label}</div>
}

export function ErrorNotice({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="soon">
      <b>Could not load data</b>
      {error}
      {onRetry ? (
        <div style={{ marginTop: 12 }}>
          <button type="button" className="ghost" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <div className="soon">{message}</div>
}

/** Wrap a screen: render the loading and error states around its content. */
export function Async<T>({
  state,
  children,
  emptyMessage,
}: {
  state: { data: T | null; error: string | null; refetch: () => void }
  children: (data: T) => ReactNode
  emptyMessage?: string
}) {
  if (state.error !== null) {
    return <ErrorNotice error={state.error} onRetry={state.refetch} />
  }
  if (state.data === null) {
    return <Loading />
  }
  if (emptyMessage !== undefined && Array.isArray(state.data) && state.data.length === 0) {
    return <EmptyState message={emptyMessage} />
  }
  return <>{children(state.data)}</>
}
