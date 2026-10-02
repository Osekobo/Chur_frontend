/**
 * Summary Reports — all-time category totals plus a contribution search.
 *
 * The search matches anywhere in a name, case-insensitively, and returns every
 * matching entry with a count and a running total.
 */

import { useState } from 'react'

import { reportsApi } from '@/api/endpoints'
import type { CategoryTotal } from '@/api/types'
import { Async, DataTable, PageHeader, Panel, PanelRow } from '@/components/ui'
import { useDebounced, useQuery } from '@/hooks/useQuery'
import { CATS_IN, CATS_OUT } from '@/lib/constants'
import { money } from '@/lib/money'

function CategoryTable({
  title,
  rows,
  categories,
  tone,
}: {
  title: string
  rows: CategoryTotal[]
  categories: readonly string[]
  tone: 'pos' | 'neg'
}) {
  return (
    <Panel className="flex-1" title={title}>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
              Category
            </th>
            <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => {
            const found = rows.find((row) => row.category === category)
            return (
              <tr key={category}>
                <td className="border-b border-line px-2.5 py-2 text-[13px]">{category}</td>
                <td className={`border-b border-line px-2.5 py-2 text-[13px] ${tone}`}>
                  {money(found?.total ?? 0)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Panel>
  )
}

function ContributionSearch() {
  const [term, setTerm] = useState('')
  const debounced = useDebounced(term.trim(), 250)
  const state = useQuery(
    () => reportsApi.searchContributions(debounced),
    [debounced],
    debounced.length > 0,
  )

  return (
    <Panel title="Search Contributions by Name">
      <div className="mb-2 mt-1 text-[13px] text-muted">
        Type a name, or part of it. Every Money In entry recorded under that name appears below,
        with a running total - covers Tithes, Offerings, Donations, Welfare, Pledges and Other
        Income.
      </div>
      <input
        type="text"
        value={term}
        placeholder="e.g. John Otieno"
        onChange={(event) => setTerm(event.target.value)}
        className="w-full rounded-md border border-line bg-bg px-2 py-1.5 text-[13px] text-ink"
      />

      <div className="mt-3">
        {debounced.length === 0 ? (
          <div className="text-[13px] text-muted">
            Start typing a name above to see their contributions.
          </div>
        ) : state.error !== null ? (
          <div className="text-[13px] text-out">{state.error}</div>
        ) : state.data === null ? (
          <div className="text-[13px] text-muted">Searching…</div>
        ) : state.data.count === 0 ? (
          <div className="text-[13px] text-muted">
            No contributions found matching &quot;{debounced.toLowerCase()}&quot;.
          </div>
        ) : (
          <>
            <div className="mb-1.5 text-[13px] text-muted">
              <b>{state.data.count}</b> contribution(s) found - Total:{' '}
              <b className="pos">{money(state.data.total)}</b>
            </div>
            <DataTable
              rows={state.data.transactions}
              rowKey={(row) => row.id}
              emptyMessage="No contributions found"
              columns={[
                { key: 'date', header: 'Date', render: (row) => row.date },
                { key: 'name', header: 'Name', render: (row) => row.party },
                { key: 'category', header: 'Category', render: (row) => row.category },
                { key: 'fund', header: 'Fund', render: (row) => row.fund || '' },
                { key: 'account', header: 'Account', render: (row) => row.account || '' },
                {
                  key: 'amount',
                  header: 'Amount',
                  render: (row) => <span className="pos">{money(row.amount)}</span>,
                },
              ]}
            />
          </>
        )}
      </div>
    </Panel>
  )
}

export function ReportsPage() {
  const state = useQuery(() => reportsApi.summary(), [])

  return (
    <>
      <PageHeader
        icon="reports"
        title="Summary Reports"
        subtitle="All-time totals across the whole system"
      />

      <ContributionSearch />

      <Async state={state}>
        {(data) => (
          <PanelRow>
            <CategoryTable
              title="Money In by Category"
              rows={data.income_by_category}
              categories={CATS_IN}
              tone="pos"
            />
            <CategoryTable
              title="Money Out by Category"
              rows={data.expense_by_category}
              categories={CATS_OUT}
              tone="neg"
            />
          </PanelRow>
        )}
      </Async>
    </>
  )
}
