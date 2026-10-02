/** Response shapes returned by the backend. */

export interface Message {
  message: string
}

export type TransactionType = 'income' | 'expense'
export type Account = 'Cash' | 'Bank' | 'M-PESA'

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
  role: 'Member' | 'Supplier' | 'Employee' | 'User'
  name: string
  phone: string
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

export interface TithesOnDate {
  date: string
  total: string
  entry_count: number
}

export interface PctDeductionPreview {
  date: string
  pct: string
  tithes_that_day: string
  deduction_amount: string
}

export interface PctDeductionResult {
  transaction: Transaction
  tithes_that_day: string
  deduction_amount: string
}

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  /** Display label derived from the two flags: User | Administrator | Deactivated. */
  role: 'User' | 'Administrator' | 'Deactivated'
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
