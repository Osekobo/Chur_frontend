/**
 * The navigation tree and form constants, copied from mm.html.
 *
 * The order and grouping here are what the sidebar renders, and the categories
 * are what the report screens iterate over — so the API's reference data is
 * used for form dropdowns while these lists fix the display order.
 */

import type { Account } from '@/api/types'

import type { IconName } from '@/lib/icons'

export const CATS_IN = [
  'Tithes',
  'Offerings',
  'Donations',
  'Welfare',
  'Pledges',
  'Other Income',
] as const

export const CATS_OUT = [
  'Expenses',
  'Petty Cash',
  'Suppliers',
  'Payments',
  'Percentage Deduction',
] as const

/** Must match the Fund enum in app/enums.py, which the API validates against. */
export const FUNDS = [
  'General Fund',
  'Building',
  'Youth',
  'Men',
  'Sunday School',
  'Missions',
  'Other',
] as const

export const ACCOUNTS: readonly Account[] = ['Cash', 'Bank', 'M-PESA']

export const MEMBER_CATEGORIES = ['Men', 'Women', 'Youth', 'Sunday School'] as const

export const PERSON_ROLES = ['Member', 'Supplier', 'Employee', 'User'] as const

export type PersonRoleName = (typeof PERSON_ROLES)[number]

/** Percentage deductions always come off the whole collection. */
export const DEDUCTION_FUND = 'General Fund'

/** Used as the party when a deduction has no purpose typed in. */
export const DEFAULT_DEDUCTION_PARTY = 'Percentage Deduction'

export const PAGE_SIZE = 500

export interface NavItem {
  /** Route segment under the app shell. */
  k: string
  /** Human label. */
  l: string
  /**
   * Hidden from anyone who is not an administrator. Only a hint for the sidebar -
   * the server enforces the same rule and answers 403 either way.
   */
  adminOnly?: boolean
}

export interface NavGroup {
  /** FontAwesome glyph shown beside the group label. */
  icon: IconName
  label: string
  items: NavItem[]
}

/** Sidebar groups, in mm.html's order. */
export const NAV: NavGroup[] = [
  { icon: 'dashboard', label: 'Dashboard', items: [{ k: 'dashboard', l: 'Dashboard' }] },
  {
    icon: 'moneyIn',
    label: 'Money In',
    items: [
      { k: 'in/all', l: 'All Money In' },
      { k: 'in/Tithes', l: 'Tithes' },
      { k: 'in/Offerings', l: 'Offerings' },
      { k: 'in/Donations', l: 'Donations' },
      { k: 'in/Welfare', l: 'Welfare' },
      { k: 'in/Pledges', l: 'Pledges' },
      { k: 'in/Other Income', l: 'Other Income' },
    ],
  },
  {
    icon: 'moneyOut',
    label: 'Money Out',
    items: [
      { k: 'out/all', l: 'All Money Out' },
      { k: 'out/Expenses', l: 'Expenses' },
      { k: 'out/Petty Cash', l: 'Petty Cash' },
      { k: 'out/Suppliers', l: 'Suppliers' },
      { k: 'out/Payments', l: 'Payments' },
    ],
  },
  {
    icon: 'accounts',
    label: 'Accounts',
    items: [
      { k: 'acct/Cash', l: 'Cash' },
      { k: 'acct/Bank', l: 'Bank' },
      { k: 'acct/M-PESA', l: 'M-PESA' },
      { k: 'transfers', l: 'Transfers' },
    ],
  },
  {
    icon: 'funds',
    label: 'Funds & Projects',
    items: [
      { k: 'fund/General Fund', l: 'General Fund' },
      { k: 'fund/Building', l: 'Building' },
      { k: 'fund/Youth', l: 'Youth' },
      { k: 'fund/Men', l: 'Men' },
      { k: 'fund/Sunday School', l: 'Sunday School' },
      { k: 'fund/Missions', l: 'Missions' },
      { k: 'fund/Other', l: 'Other Funds' },
    ],
  },
  {
    icon: 'accounting',
    label: 'Accounting',
    items: [
      { k: 'ledger', l: 'General Ledger' },
      { k: 'pctded', l: 'Tithe % Deduction' },
      { k: 'coa', l: 'Chart of Accounts' },
      { k: 'trial', l: 'Trial Balance' },
      { k: 'finstate', l: 'Financial Statements' },
    ],
  },
  {
    icon: 'people',
    label: 'People',
    items: [
      { k: 'people/Member', l: 'Members' },
      { k: 'people/Supplier', l: 'Suppliers' },
      { k: 'people/Employee', l: 'Employees' },
      { k: 'people/User', l: 'Users' },
    ],
  },
  {
    icon: 'approvals',
    label: 'Approvals',
    items: [{ k: 'approvals', l: 'Requests / Pending / Approved' }],
  },
  { icon: 'reports', label: 'Reports', items: [{ k: 'reports', l: 'Summary Reports' }] },
  {
    icon: 'administration',
    label: 'Administration',
    items: [
      { k: 'admin/users', l: 'Users', adminOnly: true },
      { k: 'admin/audit', l: 'Audit Log', adminOnly: true },
    ],
  },
]
