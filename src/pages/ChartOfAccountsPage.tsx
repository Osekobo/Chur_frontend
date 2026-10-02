/**
 * Chart of Accounts — every account this system tracks, with its live balance.
 *
 * As in mm.html, all six income and five expense categories are always listed,
 * even at zero, so this reads as a complete chart rather than only the accounts
 * that happen to have been used.
 */

import { reportsApi, transactionsApi } from '@/api/endpoints'
import type { AccountSummary } from '@/api/types'
import { Async, PageHeader, Panel } from '@/components/ui'
import { useQuery } from '@/hooks/useQuery'
import { ACCOUNTS, CATS_IN, CATS_OUT, FUNDS } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'

function Rows({
  rows,
  amount,
  columnLabel,
  totalName,
  total,
}: {
  rows: { name: string; type: string; value: number }[]
  amount: (row: { value: number }) => string
  columnLabel: string
  totalName: string
  total: number
}) {
  return (
    <table className="mt-2 w-full border-collapse">
      <thead>
        <tr>
          <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
            Account
          </th>
          <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
            Type
          </th>
          <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
            {columnLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td className="border-b border-line px-2.5 py-2 text-[13px]">{row.name}</td>
            <td className="border-b border-line px-2.5 py-2 text-[13px]">{row.type}</td>
            <td className="border-b border-line px-2.5 py-2 text-[13px]">{amount(row)}</td>
          </tr>
        ))}
        <tr className="font-bold">
          <td colSpan={2} className="border-b border-line px-2.5 py-2 text-[13px]">
            {totalName}
          </td>
          <td className="border-b border-line px-2.5 py-2 text-[13px]">{money(total)}</td>
        </tr>
      </tbody>
    </table>
  )
}

export function ChartOfAccountsPage() {
  const state = useQuery(() => reportsApi.chartOfAccounts(), [])
  const funds = useQuery(() => transactionsApi.fundNet(), [])

  return (
    <>
      <PageHeader
        icon="chartOfAccounts"
        title="Chart of Accounts"
        subtitle="Every account this system tracks, with its balance right now. Calculated live from every transaction ever entered - nothing here is typed in by hand."
      />

      <Async state={state}>
        {(data) => {
          const byAccount = new Map<string, AccountSummary>(
            data.accounts.map((row) => [row.account, row]),
          )
          const balanceOf = (name: string) => toNumber(byAccount.get(name)?.balance ?? 0)
          const creditOf = (name: string) => toNumber(byAccount.get(name)?.credit ?? 0)
          const debitOf = (name: string) => toNumber(byAccount.get(name)?.debit ?? 0)
          const total = (values: number[]) => values.reduce((acc, value) => acc + value, 0)

          const assets = ACCOUNTS.map((name) => ({ name, type: 'Asset', value: balanceOf(name) }))
          const income = CATS_IN.map((name) => ({ name, type: 'Income', value: creditOf(name) }))
          const expenses = CATS_OUT.map((name) => ({ name, type: 'Expense', value: debitOf(name) }))

          return (
            <>
              <Panel title="Assets">
                <Rows
                  rows={assets}
                  amount={(row) => money(row.value)}
                  columnLabel="Balance"
                  totalName="Total Assets"
                  total={total(assets.map((row) => row.value))}
                />
              </Panel>

              <Panel title="Income Accounts">
                <Rows
                  rows={income}
                  amount={(row) => money(row.value)}
                  columnLabel="Total Collected (All-Time)"
                  totalName="Total Income"
                  total={total(income.map((row) => row.value))}
                />
              </Panel>

              <Panel title="Expense Accounts">
                <Rows
                  rows={expenses}
                  amount={(row) => money(row.value)}
                  columnLabel="Total Spent (All-Time)"
                  totalName="Total Expenses"
                  total={total(expenses.map((row) => row.value))}
                />
              </Panel>

              <Panel title="Fund Balances">
                <span className="text-[12px] text-muted">
                  (memo only - shows how the cash above is allocated across ministry funds, not
                  separate accounts)
                </span>
                <table className="mt-2 w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                        Fund
                      </th>
                      <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {FUNDS.map((fund) => {
                      const found = funds.data?.find((row) => row.key === fund)
                      return (
                        <tr key={fund}>
                          <td className="border-b border-line px-2.5 py-2 text-[13px]">{fund}</td>
                          <td className="border-b border-line px-2.5 py-2 text-[13px]">
                            {money(found?.total ?? 0)}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="font-bold">
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">
                        Total Across Funds
                      </td>
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">
                        {money(total(FUNDS.map((fund) => toNumber(
                          funds.data?.find((row) => row.key === fund)?.total ?? 0,
                        ))))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Panel>
            </>
          )
        }}
      </Async>
    </>
  )
}
