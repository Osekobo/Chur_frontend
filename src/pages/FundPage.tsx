/** A single fund: what came in, what went out, and the balance. */

import { useParams } from 'react-router-dom'

import { transactionsApi } from '@/api/endpoints'
import { Pill } from '@/components/form'
import { Async, Card, Cards, DataTable, PageHeader } from '@/components/ui'
import { useQuery } from '@/hooks/useQuery'
import { FUNDS, PAGE_SIZE } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'

export function FundPage() {
  const params = useParams<{ fund: string }>()
  const raw = params.fund ?? 'General Fund'
  const fund = FUNDS.find((name) => name === raw) ?? 'General Fund'

  const state = useQuery(
    () => transactionsApi.list({ fund, limit: PAGE_SIZE, order: 'desc' }),
    [fund],
  )
  // The list above is capped at PAGE_SIZE, so the three figures come from the
  // server's own per-fund totals instead of from summing that page.
  const summary = useQuery(() => transactionsApi.fundSummary(), [])
  const row = summary.data?.find((item) => item.fund === fund)
  const received = toNumber(row?.received ?? 0)
  const spent = toNumber(row?.spent ?? 0)

  return (
    <>
      <PageHeader icon="funds" title={fund} />
      <Cards>
        <Card label="Received" value={money(received)} tone="pos" />
        <Card label="Spent" value={money(spent)} tone="neg" />
        <Card label="Balance" value={money(received - spent)} />
      </Cards>

      <Async state={state}>
        {(data) => (
          <DataTable
            rows={data}
            rowKey={(row) => row.id}
            emptyMessage="No transactions yet"
            columns={[
              { key: 'date', header: 'Date', render: (row) => row.date },
              {
                key: 'type',
                header: 'Type',
                render: (row) => <Pill direction={row.type} />,
              },
              { key: 'category', header: 'Category', render: (row) => row.category },
              { key: 'party', header: 'Party', render: (row) => row.party || '' },
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
        )}
      </Async>
    </>
  )
}
