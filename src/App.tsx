/**
 * Routes.
 *
 * The sidebar keys map one-to-one onto these paths, so the URL always says
 * which screen is open: /dashboard, /in/Tithes, /fund/Building, /approvals
 * and so on.
 */

import { Navigate, Route, Routes } from 'react-router-dom'

import { Shell } from '@/components/Shell'
import { useAuth } from '@/auth/AuthContext'
import { AccountPage } from '@/pages/AccountPage'
import { AdminUsersPage } from '@/pages/AdminUsersPage'
import { ApprovalsPage } from '@/pages/ApprovalsPage'
import { AuditLogPage } from '@/pages/AuditLogPage'
import { ChartOfAccountsPage } from '@/pages/ChartOfAccountsPage'
import { Dashboard } from '@/pages/Dashboard'
import { FinancialStatementsPage } from '@/pages/FinancialStatementsPage'
import { FundPage } from '@/pages/FundPage'
import { LedgerPage } from '@/pages/LedgerPage'
import { LoginPage } from '@/pages/LoginPage'
import { MoneyPage } from '@/pages/MoneyPage'
import { PctDeductionPage } from '@/pages/PctDeductionPage'
import { PeoplePage } from '@/pages/PeoplePage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SoonPage } from '@/pages/SoonPage'
import { TransfersPage } from '@/pages/TransfersPage'
import { TrialBalancePage } from '@/pages/TrialBalancePage'
import { Loading } from '@/components/ui'

export function App() {
  const { user, initialising } = useAuth()

  if (initialising) return <Loading label="Loading…" />

  if (user === null) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route element={<Shell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/in/:category" element={<MoneyPage direction="income" />} />
        <Route path="/out/:category" element={<MoneyPage direction="expense" />} />
        <Route path="/acct/:account" element={<AccountPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/fund/:fund" element={<FundPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/pctded" element={<PctDeductionPage />} />
        <Route path="/coa" element={<ChartOfAccountsPage />} />
        <Route path="/trial" element={<TrialBalancePage />} />
        <Route path="/finstate" element={<FinancialStatementsPage />} />
        <Route path="/people/:role" element={<PeoplePage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route
          path="/admin/users"
          element={
            user.is_superuser ? (
              <AdminUsersPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/admin/audit"
          element={
            user.is_superuser ? (
              <AuditLogPage />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route path="/soon/:name" element={<SoonPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
