/** Financial Statements — Income & Expenditure + Statement of Financial Position. */

import { reportsApi } from '@/api/endpoints'
import { Async, Card, Cards, PageHeader, Panel } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { useQuery } from '@/hooks/useQuery'
import { ACCOUNTS, CATS_IN, CATS_OUT, FUNDS } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'

export function FinancialStatementsPage() {
  const state = useQuery(() => reportsApi.financialStatements(), [])

  return (
    <>
      <PageHeader
        icon="financialStatements"
        title="Financial Statements"
        subtitle="Two standard church financial reports, calculated live from every transaction on file."
      />

      <Async state={state}>
        {(data) => {
          const fundsTotal = FUNDS.reduce((acc, fund) => {
            const found = data.fund_position.find((row) => row.key === fund)
            return acc + toNumber(found?.total ?? 0)
          }, 0)
          const matches = Math.round(toNumber(data.total_assets) * 100) === Math.round(fundsTotal * 100)

          return (
            <>
              <Panel title="Income & Expenditure Statement (All-Time)">
                <table className="mt-2 w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                        Income
                      </th>
                      <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATS_IN.map((category) => {
                      const found = data.income.find((row) => row.category === category)
                      return (
                        <tr key={category}>
                          <td className="border-b border-line px-2.5 py-2 text-[13px]">{category}</td>
                          <td className="border-b border-line px-2.5 py-2 text-[13px] text-in">
                            {money(found?.total ?? 0)}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="font-bold">
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">Total Income</td>
                      <td className="border-b border-line px-2.5 py-2 text-[13px] text-in">
                        {money(data.total_income)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="mt-3.5 w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                        Expenditure
                      </th>
                      <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATS_OUT.map((category) => {
                      const found = data.expenses.find((row) => row.category === category)
                      return (
                        <tr key={category}>
                          <td className="border-b border-line px-2.5 py-2 text-[13px]">{category}</td>
                          <td className="border-b border-line px-2.5 py-2 text-[13px] text-out">
                            {money(found?.total ?? 0)}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="font-bold">
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">Total Expenditure</td>
                      <td className="border-b border-line px-2.5 py-2 text-[13px] text-out">
                        {money(data.total_expenses)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <Cards>
                  <Card
                    label="Net Surplus / (Deficit)"
                    tone={toNumber(data.net_surplus) >= 0 ? 'pos' : 'neg'}
                    value={money(data.net_surplus)}
                  />
                </Cards>
              </Panel>

              <Panel title="Statement of Financial Position (as of today)">
                <table className="mt-2 w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                        Assets
                      </th>
                      <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ACCOUNTS.map((account) => {
                      const found = data.account_position.find((row) => row.account === account)
                      return (
                        <tr key={account}>
                          <td className="border-b border-line px-2.5 py-2 text-[13px]">{account}</td>
                          <td className="border-b border-line px-2.5 py-2 text-[13px]">
                            {money(found?.balance ?? 0)}
                          </td>
                        </tr>
                      )
                    })}
                    <tr className="font-bold">
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">Total Assets</td>
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">
                        {money(data.total_assets)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-2.5 text-[13px] text-muted">Represented by (Fund Balances):</div>
                <table className="mt-1.5 w-full border-collapse">
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
                      const found = data.fund_position.find((row) => row.key === fund)
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
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">Total Net Assets</td>
                      <td className="border-b border-line px-2.5 py-2 text-[13px]">
                        {money(fundsTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div
                  className={`mt-2.5 flex items-start gap-1.5 text-[13px] ${
                    matches ? 'text-in' : 'text-warn'
                  }`}
                >
                  <Icon
                    name={matches ? 'balanced' : 'warning'}
                    className="mt-[2px] text-[13px]"
                  />
                  <span>
                    {matches
                      ? 'Total Assets matches Total Net Assets across Funds.'
                      : 'Total Assets does not match Fund totals - check that every transaction has a Fund selected.'}
                  </span>
                </div>
                <div className="mt-1 text-[13px] text-muted">
                  Note: this system does not currently track loans or other liabilities, so Total
                  Assets and Total Net Assets are the same figure.
                </div>
              </Panel>
            </>
          )
        }}
      </Async>
    </>
  )
}
