/** Response shapes returned by the backend. */

export interface Message {
  message: string
}

export type TransactionType = 'income' | 'expense'
export type Account = 'Cash' | 'Bank' | 'M-PESA'

/**
 * What a signed-in account is there to do. One role per account.
 *
 * The server decides what each role may do (see Permission and
 * app/core/permissions.py); this list exists so the interface can hide what the
 * server would refuse rather than offering a page that answers 403.
 */
export type UserRole = 'accountant' | 'secretary' | 'admin'

/** One thing a role may be allowed to do, as sent by GET /auth/me. */
export type Permission =
  | 'dashboard:view'
  | 'people:view'
  | 'people:manage'
  | 'money:in'
  | 'money:out'
  | 'transfers:manage'
  | 'deductions:manage'
  | 'accounting:view'
  | 'reports:view'
  | 'approvals:view'
  | 'approvals:request'
  | 'approvals:decide'
  | 'users:manage'
  | 'audit:view'

export interface Transaction {
  id: string
  type: TransactionType
  category: string
  party: string
  /** Pydantic serialises Decimal as a JSON string, e.g. "1000.00". */
  amount: string
  fund: string
  account: Account
  notes: string
  date: string
  transfer_id: string | null
  pct: string | null
  base_total: string | null
  created_by_id: string | null
  created_at: string
  updated_at: string
}

export interface Transfer {
  transfer_id: string
  date: string
  from_account: Account
  to_account: Account
  amount: string
  notes: string
}

export interface Person {
  id: string
  role: 'Member' | 'Guest' | 'Supplier' | 'Employee' | 'User'
  name: string
  phone: string
  /** Empty unless the role is one the church always emails. */
  email: string
  category: string
  notes: string
  created_at: string
  updated_at: string
}

export interface NamedTotal {
  key: string
  total: string
}

export interface FundSummary {
  fund: string
  received: string
  spent: string
  net: string
}

export interface CategoryTotal {
  category: string
  total: string
}

export interface AccountSummary {
  account: string
  account_type: string
  debit: string
  credit: string
  balance: string
}

export interface DashboardSummary {
  total_income: string
  total_expenses: string
  net_balance: string
  member_count: number
  person_count: number
  transaction_count: number
  balance_by_account: NamedTotal[]
  net_by_fund: NamedTotal[]
  income_by_category: CategoryTotal[]
  expense_by_category: CategoryTotal[]
  recent_transactions: Transaction[]
}

export interface SummaryReport {
  income_by_category: CategoryTotal[]
  expense_by_category: CategoryTotal[]
  total_income: string
  total_expenses: string
  net_balance: string
  transaction_count: number
}

export interface ChartOfAccounts {
  accounts: AccountSummary[]
  total_debits: string
  total_credits: string
  is_balanced: boolean
}

export interface TrialBalance extends ChartOfAccounts {
  difference: string
}

export interface FinancialStatements {
  income: CategoryTotal[]
  expenses: CategoryTotal[]
  total_income: string
  total_expenses: string
  net_surplus: string
  account_position: AccountSummary[]
  total_assets: string
  fund_position: NamedTotal[]
}

export interface ContributionSearchResult {
  search: string
  count: number
  total: string
  transactions: Transaction[]
}

export interface MemberContribution {
  member: string
  total: string
  contribution_count: number
  by_category: CategoryTotal[]
  transactions: Transaction[]
}

export interface ReferenceData {
  person_roles: string[]
  member_categories: string[]
  accounts: string[]
  funds: string[]
  income_categories: string[]
  expense_categories: string[]
  transfer_category: string
  transaction_types: string[]
}

/**
 * What a Tithe % Deduction is taken from. An account takes the percentage off the
 * tithes collected into that account and posts the deduction there; `'all'` uses
 * the tithes collected that day across every account and splits the deduction
 * between them. Matches TitheScope in app/enums.py.
 */
export type TitheScope = Account | 'all'

export interface TithesOnDate {
  date: string
  total: string
  entry_count: number
}

/** One account's part of a deduction, so a split can be shown as it happens. */
export interface DeductionShare {
  account: Account
  tithes: string
  deduction_amount: string
}

export interface PctDeductionPreview {
  date: string
  pct: string
  /** Tithes in the chosen scope on this date. */
  tithes_that_day: string
  deduction_amount: string
  /** Per-account breakdown, empty when the chosen account has no tithes. */
  shares: DeductionShare[]
}

export interface PctDeductionResult {
  /** One entry for a single account, one per account when the scope is `'all'`. */
  transactions: Transaction[]
  tithes_that_day: string
  /** Total across every created entry. */
  deduction_amount: string
  shares: DeductionShare[]
}

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  role: UserRole
  /** Capitalised name for display: Accountant | Secretary | Administrator | Deactivated. */
  role_label: string
  /** What this account may do, so the interface can hide the rest. */
  permissions: Permission[]
  last_login_at: string | null
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface AuthSession {
  user: User
  tokens: TokenPair
}

export interface AuthConfig {
  allow_public_registration: boolean
  password_min_length: number
  return_reset_link_in_response: boolean
}

/* ------------------------------------------------------------- approvals -- */

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Approval {
  id: string
  status: ApprovalStatus
  category: string
  party: string
  /** Decimal, serialised as a JSON string like a transaction amount. */
  amount: string
  fund: string
  account: Account
  notes: string
  date: string
  requested_by_id: string | null
  decided_by_id: string | null
  decided_at: string | null
  decision_note: string
  /** Set only once approved; points at the ledger row it created. */
  transaction_id: string | null
  is_pending: boolean
  created_at: string
  updated_at: string
}

export interface ApprovalSummary {
  pending: number
  approved: number
  rejected: number
  total: number
}

/* ----------------------------------------------------------------- audit -- */

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'role_change'
  | 'password_reset'
  | 'account_deactivated'
  | 'account_reactivated'
  | 'approve'
  | 'reject'

export type AuditEntity = 'transaction' | 'person' | 'user' | 'auth' | 'approval'

/**
 * `changes` is deliberately loose: a transaction edit records money while a role
 * change records a flag, and one type has to cover both. Values are
 * `{ field: [before, after] }` for an edit, or a flat map for a creation.
 */
export type AuditChanges = Record<string, unknown> | null

export interface AuditEntry {
  id: string
  actor_id: string | null
  actor_email: string
  action: AuditAction
  entity_type: AuditEntity
  entity_id: string | null
  summary: string
  changes: AuditChanges
  ip_address: string
  created_at: string
}

/** The paginated envelope every list endpoint uses. */
export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}
