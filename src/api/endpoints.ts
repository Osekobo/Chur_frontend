/** Typed wrappers for every endpoint the screens use. */

import { api, getRefreshToken } from './client'
import type {
  Account,
  Approval,
  ApprovalStatus,
  ApprovalSummary,
  AuditAction,
  AuditEntity,
  AuditEntry,
  AuthConfig,
  AuthSession,
  ChartOfAccounts,
  ContributionSearchResult,
  DashboardSummary,
  FinancialStatements,
  FundSummary,
  MemberContribution,
  Message,
  NamedTotal,
  Page,
  PctDeductionPreview,
  PctDeductionResult,
  Person,
  ReferenceData,
  SummaryReport,
  TithesOnDate,
  UserRole,
  TitheScope,
  Transaction,
  Transfer,
  TrialBalance,
  User,
} from './types'

/* ------------------------------------------------------------------ auth -- */

export const authApi = {
  login: (email: string, password: string) =>
    api.anonymous.post<AuthSession>('/auth/login', { email, password }),
  register: (email: string, full_name: string, password: string) =>
    api.anonymous.post<AuthSession>('/auth/register', { email, full_name, password }),
  me: () => api.get<User>('/auth/me'),
  config: () => api.anonymous.get<AuthConfig>('/auth/config'),
  logout: () => api.post<Message>('/auth/logout', { refresh_token: getRefreshToken() }),
  forgotPassword: (email: string) =>
    api.anonymous.post<{ message: string; reset_url: string | null }>('/auth/forgot-password', {
      email,
    }),
  resetPassword: (token: string, new_password: string) =>
    api.anonymous.post<Message>('/auth/reset-password', { token, new_password }),
}

/* ------------------------------------------------- administration (admin) -- */

/**
 * Every call here is refused with 403 unless the signed-in user is an
 * administrator, so this object is only reachable from the admin screen.
 */
export const usersApi = {
  list: () => api.get<User[]>('/users'),
  create: (payload: {
    email: string
    full_name: string
    password: string
    role: UserRole
  }) => api.post<User>('/users', payload),
  update: (id: string, payload: { full_name?: string; is_active?: boolean; role?: UserRole }) =>
    api.patch<User>(`/users/${id}`, payload),
  setPassword: (id: string, new_password: string) =>
    api.post<Message>(`/users/${id}/password`, { new_password }),
  revokeSessions: (id: string) => api.post<Message>(`/users/${id}/sessions`),
}

/* ------------------------------------------------------------- approvals -- */

export interface ApprovalInput {
  category: string
  party?: string
  amount: number
  fund: string
  account: Account
  notes?: string
  date: string
}

/**
 * Any signed-in user may raise and read a request; `approve` and `reject` are
 * administrator-only and answer 403 otherwise. The server decides, this only
 * avoids showing buttons that cannot work.
 */
export const approvalsApi = {
  list: (params: { status?: ApprovalStatus; mine?: boolean } = {}) =>
    api.get<Approval[]>('/approvals', params),
  count: () => api.get<ApprovalSummary>('/approvals/count'),
  create: (payload: ApprovalInput) => api.post<Approval>('/approvals', payload),
  approve: (id: string, note = '') => api.post<Approval>(`/approvals/${id}/approve`, { note }),
  reject: (id: string, note = '') => api.post<Approval>(`/approvals/${id}/reject`, { note }),
}

/* ----------------------------------------------------------------- audit -- */

export interface AuditListParams {
  action?: AuditAction
  entity?: AuditEntity
  actor_id?: string
  search?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

/** Administrator-only: the server answers 403 for anyone else. */
export const auditApi = {
  list: (params: AuditListParams = {}) => api.get<Page<AuditEntry>>('/audit', params),
}

/* --------------------------------------------------------- transactions -- */

export interface TransactionListParams {
  type?: 'income' | 'expense'
  category?: string
  account?: Account
  fund?: string
  party?: string
  search?: string
  date_from?: string
  date_to?: string
  include_transfers?: boolean
  order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface TransactionInput {
  type: 'income' | 'expense'
  category: string
  party?: string
  amount: number
  fund: string
  account: Account
  notes?: string
  date: string
  /** Required for income, refused for an expense: the giver is in the directory. */
  person_id?: string
  /** This form's token for this entry. Sending the same one twice returns the
      entry already written instead of writing a second one, so a double-click or
      a retry after a dropped connection cannot double-count money. */
  client_request_id?: string
}

export const transactionsApi = {
  list: (params: TransactionListParams = {}) => api.get<Transaction[]>('/transactions', params),
  create: (payload: TransactionInput) => api.post<Transaction>('/transactions', payload),
  remove: (id: string) => api.delete<Message>(`/transactions/${id}`),
  accountBalances: () => api.get<NamedTotal[]>('/transactions/accounts/balances'),
  fundNet: () => api.get<NamedTotal[]>('/transactions/funds/net'),
  fundSummary: () => api.get<FundSummary[]>('/transactions/funds/summary'),
  listTransfers: () => api.get<Transfer[]>('/transactions/transfers'),
  createTransfer: (payload: {
    from_account: Account
    to_account: Account
    amount: number
    date: string
    notes?: string
  }) => api.post<Transfer>('/transactions/transfers', payload),
}

/* ---------------------------------------------------- tithe % deduction -- */

export const deductionsApi = {
  tithesOnDate: (date: string) => api.get<TithesOnDate>('/accounting/tithes-on-date', { date }),
  preview: (date: string, pct: number, account: TitheScope = 'Cash') =>
    api.get<PctDeductionPreview>('/accounting/pct-deduction-preview', { date, pct, account }),
  history: () => api.get<Transaction[]>('/transactions/pct-deductions'),
  create: (payload: {
    date: string
    pct: number
    account: TitheScope
    notes: string
  }) => api.post<PctDeductionResult>('/transactions/pct-deduction', payload),
}

/* ---------------------------------------------------------------- people -- */

export interface PersonInput {
  role: Person['role']
  name: string
  phone?: string
  /** Required by the server for suppliers, employees and users. */
  email?: string
  category?: string
  notes?: string
}

export const peopleApi = {
  list: (params: { role?: Person['role']; search?: string; limit?: number } = {}) =>
    api.get<Person[]>('/people', params),
  create: (payload: PersonInput) => api.post<Person>('/people', payload),
  update: (id: string, payload: Partial<PersonInput>) =>
    api.patch<Person>(`/people/${id}`, payload),
  remove: (id: string) => api.delete<Message>(`/people/${id}`),
  count: () => api.get<Record<string, number>>('/people/count'),
}

/* ------------------------------------------------------------- reporting -- */

export const reportsApi = {
  dashboard: () => api.get<DashboardSummary>('/dashboard'),
  summary: () => api.get<SummaryReport>('/reports/summary'),
  contributionNames: () => api.get<string[]>('/reports/member-contributions'),
  searchContributions: (search: string) =>
    api.get<ContributionSearchResult>('/reports/contributions', { search }),
  memberContributions: (name: string) =>
    api.get<MemberContribution[]>('/reports/member-contributions/detail', { name }),
  ledger: (includeTransfers = true) =>
    api.get<Transaction[]>('/accounting/ledger', { include_transfers: includeTransfers }),
  chartOfAccounts: () => api.get<ChartOfAccounts>('/accounting/chart-of-accounts'),
  trialBalance: () => api.get<TrialBalance>('/accounting/trial-balance'),
  financialStatements: () => api.get<FinancialStatements>('/accounting/financial-statements'),
  reference: () => api.get<ReferenceData>('/reference'),
}
