/** Dashboard — the four KPI cards plus the two balance tables. */

import { reportsApi } from '@/api/endpoints'
import { Async, Card, Cards, DataTable, PageHeader, Panel, PanelRow } from '@/components/ui'
import { useQuery } from '@/hooks/useQuery'
import { money } from '@/lib/money'

export function Dashboard() {
  const state = useQuery(() => reportsApi.dashboard(), [])

  return (
    <Async state={state}>
      {(data) => (
        <>
          <PageHeader
            icon="dashboard"
            title="Dashboard"
            subtitle="Overview of all recorded church finances"
          />

          <Cards>
            <Card label="Total Money In" value={money(data.total_income)} tone="pos" />
            <Card label="Total Money Out" value={money(data.total_expenses)} tone="neg" />
            <Card label="Net Balance" value={money(data.net_balance)} />
            <Card label="Members Recorded" value={data.member_count} />
          </Cards>

          <PanelRow>
            <Panel className="flex-1" title="Balance by Account">
              <table className="mt-2 w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                      Account
                    </th>
                    <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.balance_by_account.map((row) => (
                    <tr key={row.key}>
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">{row.key}</td>
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">
                        {money(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel className="flex-1" title="Net by Fund">
              <table className="mt-2 w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                      Fund
                    </th>
                    <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.net_by_fund.map((row) => (
                    <tr key={row.key}>
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">{row.key}</td>
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">
                        {money(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </PanelRow>

          <Panel title="Recent entries">
            <DataTable
              rows={data.recent_transactions}
              rowKey={(row) => row.id}
              emptyMessage="No entries yet"
              columns={[
                { key: 'date', header: 'Date', render: (row) => row.date },
                { key: 'category', header: 'Category', render: (row) => row.category },
                { key: 'party', header: 'Party', render: (row) => row.party || '' },
                { key: 'account', header: 'Account', render: (row) => row.account },
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
          </Panel>
        </>
      )}
    </Async>
  )
}
