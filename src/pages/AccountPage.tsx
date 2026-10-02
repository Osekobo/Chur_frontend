/** A single payment account: its balance and every entry that touched it. */

import { useParams } from 'react-router-dom'

import { transactionsApi } from '@/api/endpoints'
import type { Account as AccountName } from '@/api/types'
import { Pill } from '@/components/form'
import { Async, Card, Cards, DataTable, PageHeader } from '@/components/ui'
import { useQuery } from '@/hooks/useQuery'
import { ACCOUNTS, PAGE_SIZE } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'

export function AccountPage() {
  const params = useParams<{ account: string }>()
  const raw = params.account ?? 'Cash'
  const account = (ACCOUNTS.find((name) => name === raw) ?? 'Cash') as AccountName

  // The entry list is capped at PAGE_SIZE, so the balance comes from the server's
  // own total rather than from summing this page - otherwise it silently drifts
  // once an account passes the cap.
  const state = useQuery(
    () => transactionsApi.list({ account, limit: PAGE_SIZE, order: 'desc' }),
    [account],
  )
  const balances = useQuery(() => transactionsApi.accountBalances(), [])
  const balance = toNumber(balances.data?.find((row) => row.key === account)?.total ?? 0)

  return (
    <>
      <PageHeader icon="account" title={account} />
      <Cards>
        <Card label="Current Balance" value={money(balance)} />
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
