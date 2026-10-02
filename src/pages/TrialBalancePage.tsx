/**
 * Trial Balance — every account's balance as a Debit or a Credit.
 *
 * Assets that are overdrawn move to the credit column and are shown as a
 * positive figure there, which is what keeps the two columns comparable.
 */

import { reportsApi } from '@/api/endpoints'
import type { AccountSummary } from '@/api/types'
import { Async, Card, Cards, PageHeader, Panel, PanelRow } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { useQuery } from '@/hooks/useQuery'
import { ACCOUNTS, CATS_IN, CATS_OUT } from '@/lib/constants'
import { money, toNumber } from '@/lib/money'

function Column({
  title,
  rows,
  total,
}: {
  title: string
  rows: { name: string; amount: number }[]
  total: number
}) {
  return (
    <Panel className="flex-1" title={title}>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
              Account
            </th>
            <th className="border-b border-line bg-bg px-2.5 py-2 text-left text-[13px] font-bold text-muted">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="border-b border-line px-2.5 py-2 text-[13px]">{row.name}</td>
              <td className="border-b border-line px-2.5 py-2 text-[13px]">{money(row.amount)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="border-b border-line px-2.5 py-2 text-[13px]">Total</td>
            <td className="border-b border-line px-2.5 py-2 text-[13px]">{money(total)}</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  )
}

export function TrialBalancePage() {
  // One request only. The trial-balance payload already carries every account
  // and category balance, so a second call to /transactions/accounts/balances
  // was redundant - and its failure was invisible, leaving the page showing a
  // confident Balanced/Out of balance verdict from a half-populated dataset.
  const state = useQuery(() => reportsApi.trialBalance(), [])

  return (
    <>
      <PageHeader
        icon="accounting"
        title="Trial Balance"
        subtitle="Every account's balance as a Debit or Credit. In a correct set of books these two columns always add up to the same total - this is calculated fresh from your transactions every time you open this page, so if it's ever out of balance, something in the data needs attention."
      />

      <Async state={state}>
        {(data) => {
          const byAccount = new Map<string, AccountSummary>(
            data.accounts.map((row) => [row.account, row]),
          )
          const balanceOf = (name: string) => toNumber(byAccount.get(name)?.balance ?? 0)

          const positiveAssets = ACCOUNTS.filter((name) => balanceOf(name) >= 0)
          const negativeAssets = ACCOUNTS.filter((name) => balanceOf(name) < 0)

          const debitRows = [
            ...positiveAssets.map((name) => ({
              name: `${name} (Asset)`,
              amount: balanceOf(name),
            })),
            ...CATS_OUT.map((category) => ({
              name: `${category} (Expense)`,
              amount: toNumber(byAccount.get(category)?.debit ?? 0),
            })),
          ]
          const creditRows = [
            ...negativeAssets.map((name) => ({
              name: `${name} (Asset, overdrawn)`,
              amount: -balanceOf(name),
            })),
            ...CATS_IN.map((category) => ({
              name: `${category} (Income)`,
              amount: toNumber(byAccount.get(category)?.credit ?? 0),
            })),
          ]

          const totalDebit = debitRows.reduce((acc, row) => acc + row.amount, 0)
          const totalCredit = creditRows.reduce((acc, row) => acc + row.amount, 0)
          // Compare in cents so rounding never shows a false imbalance.
          const balanced = Math.round(totalDebit * 100) === Math.round(totalCredit * 100)

          return (
            <>
              <Cards>
                <Card label="Total Debits" value={money(totalDebit)} />
                <Card label="Total Credits" value={money(totalCredit)} />
                <Card
                  label="Status"
                  tone={balanced ? 'pos' : 'neg'}
                  value={
                    <span className="flex items-center gap-2">
                      <Icon
                        name={balanced ? 'balanced' : 'unbalanced'}
                        className="text-[16px]"
                      />
                      {balanced ? 'Balanced' : 'Out of balance'}
                    </span>
                  }
                />
              </Cards>

              <PanelRow>
                <Column title="Debit" rows={debitRows} total={totalDebit} />
                <Column title="Credit" rows={creditRows} total={totalCredit} />
              </PanelRow>
            </>
          )
        }}
      </Async>
    </>
  )
}
