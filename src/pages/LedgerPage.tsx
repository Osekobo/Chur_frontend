/**
 * General Ledger.
 *
 * mm.html downloaded the whole ledger and sliced it in the browser, capped at
 * 1000 rows. This uses the backend's limit/offset instead, so the ledger can
 * grow past that without quietly losing entries.
 */

import { useState } from 'react'

import { transactionsApi } from '@/api/endpoints'
import { Pill } from '@/components/form'
import { Async, DataTable, PageHeader } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { useQuery } from '@/hooks/useQuery'
import { money } from '@/lib/money'

const PAGE_SIZE = 100

export function LedgerPage() {
  const [page, setPage] = useState(0)

  const state = useQuery(
    () =>
      transactionsApi.list({
        order: 'asc',
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    [page],
  )

  const rows = state.data ?? []
  // A short page means there is nothing after this one.
  const hasNext = rows.length === PAGE_SIZE


  return (
    <>
      <PageHeader
        icon="ledger"
        title="General Ledger"
        subtitle="Every transaction ever recorded, in date order"
      />

      <Async state={state}>
        {(data) => (
          <>
            <DataTable
              rows={data}
              rowKey={(row) => row.id}
              emptyMessage="Nothing recorded yet"
              columns={[
                { key: 'date', header: 'Date', render: (row) => row.date },
                {
                  key: 'type',
                  header: 'Type',
                  render: (row) => <Pill direction={row.type} />,
                },
                { key: 'category', header: 'Category', render: (row) => row.category },
                { key: 'party', header: 'Party', render: (row) => row.party || '' },
                { key: 'fund', header: 'Fund', render: (row) => row.fund || '' },
                { key: 'account', header: 'Account', render: (row) => row.account || '' },
                {
                  key: 'amount',
                  header: 'Amount',
                  render: (row) => (
                    <span className={row.type === 'income' ? 'pos' : 'neg'}>
                      {money(row.amount)}
                    </span>
                  ),
                },
              ]}
            />

            <div className="mt-3 flex items-center gap-2.5 text-[13px]">
              <button
                type="button"
                className="ghost inline-flex items-center gap-1.5"
                disabled={page === 0}
                onClick={() => setPage((value) => Math.max(0, value - 1))}
              >
                <Icon name="previousPage" className="text-[11px]" />
                Previous
              </button>
              <span className="text-muted">
                {data.length === 0
                  ? `Page ${page + 1} · nothing recorded`
                  : `Page ${page + 1} · showing ${page * PAGE_SIZE + 1}–${
                      page * PAGE_SIZE + data.length
                    }`}
              </span>
              <button
                type="button"
                className="ghost inline-flex items-center gap-1.5"
                disabled={!hasNext}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
                <Icon name="nextPage" className="text-[11px]" />
              </button>
            </div>
          </>
        )}
      </Async>
    </>
  )
}
