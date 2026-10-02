/**
 * Routes.
 *
 * The sidebar keys map one-to-one onto these paths, so the URL always says
 * which screen is open: /dashboard, /in/Tithes, /fund/Building, /approvals
 * and so on.
 *
 * A route that needs a permission is wrapped in {@link Protected}, which sends
 * anyone without it back to the dashboard. That is a courtesy, not a defence:
 * the same permission is checked again on the route behind it, so guessing the
 * URL gets a 403 rather than a page. The wrapper exists so a role that cannot
 * reach a screen never sees its empty shell or a spinner that will not end.
 */

import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import type { Permission } from '@/api/types'
import { Shell } from '@/components/Shell'
import { useAuth } from '@/auth/AuthContext'
import { can } from '@/lib/permissions'
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
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { SoonPage } from '@/pages/SoonPage'
import { TransfersPage } from '@/pages/TransfersPage'
import { TrialBalancePage } from '@/pages/TrialBalancePage'
import { Loading } from '@/components/ui'

/** Rendered only for an account holding `permission`; otherwise back to the dashboard. */
function Protected({ permission, page }: { permission: Permission; page: ReactElement }) {
  const { user } = useAuth()
  return can(user, permission) ? page : <Navigate to="/dashboard" replace />
}

export function App() {
  const { user, initialising } = useAuth()

  if (initialising) return <Loading label="Loading…" />

  if (user === null) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Reachable while signed out, which is the normal case for a reset link. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      {/* Outside the Shell, so resetting does not drop a signed-in user into the
          sidebar on a screen that asks for a password. */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<Shell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/in/:category" element={<MoneyPage direction="income" />} />
        <Route
          path="/out/:category"
          element={
            <Protected permission="money:out" page={<MoneyPage direction="expense" />} />
          }
        />
        <Route path="/acct/:account" element={<AccountPage />} />
        <Route
          path="/transfers"
          element={
            <Protected permission="transfers:manage" page={<TransfersPage />} />
          }
        />
        <Route path="/fund/:fund" element={<FundPage />} />
        <Route
          path="/ledger"
          element={
            <Protected permission="accounting:view" page={<LedgerPage />} />
          }
        />
        <Route
          path="/pctded"
          element={
            <Protected permission="deductions:manage" page={<PctDeductionPage />} />
          }
        />
        <Route
          path="/coa"
          element={
            <Protected permission="accounting:view" page={<ChartOfAccountsPage />} />
          }
        />
        <Route
          path="/trial"
          element={
            <Protected permission="accounting:view" page={<TrialBalancePage />} />
          }
        />
        <Route
          path="/finstate"
          element={
            <Protected permission="accounting:view" page={<FinancialStatementsPage />} />
          }
        />
        <Route path="/people/:role" element={<PeoplePage />} />
        <Route
          path="/approvals"
          element={
            <Protected permission="approvals:view" page={<ApprovalsPage />} />
          }
        />
        <Route
          path="/admin/users"
          element={
            <Protected permission="users:manage" page={<AdminUsersPage />} />
          }
        />
        <Route
          path="/admin/audit"
          element={
            <Protected permission="audit:view" page={<AuditLogPage />} />
          }
        />
        <Route path="/soon/:name" element={<SoonPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
