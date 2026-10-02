/**
 * The FontAwesome icon set, keyed by a semantic name.
 *
 * Screens reference `IconName` values rather than importing icon objects, so the
 * choice of glyph for "money in" or "trial balance" is made once here. It also
 * keeps every screen tree-shakeable: only the icons listed below are bundled.
 *
 * The original mm.html drew its navigation groups with plain text headers. These
 * are the equivalents chosen for a church ledger - sober, accounting-flavoured
 * glyphs rather than the decorative emoji this port had grown.
 */

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faArrowDown,
  faArrowRightArrowLeft,
  faArrowUp,
  faBars,
  faBookOpen,
  faBullseye,
  faBuildingColumns,
  faChartColumn,
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faChurch,
  faCircleCheck,
  faCircleXmark,
  faClipboardCheck,
  faClockRotateLeft,
  faFileInvoiceDollar,
  faGaugeHigh,
  faGear,
  faListCheck,
  faMagnifyingGlass,
  faPercent,
  faPlus,
  faRightLeft,
  faScaleBalanced,
  faTrashCan,
  faTriangleExclamation,
  faUsers,
  faWallet,
} from '@fortawesome/free-solid-svg-icons'

export const ICONS = {
  /* Brand */
  church: faChurch,

  /* Navigation groups */
  dashboard: faGaugeHigh,
  moneyIn: faArrowDown,
  moneyOut: faArrowUp,
  accounts: faBuildingColumns,
  funds: faBullseye,
  accounting: faScaleBalanced,
  people: faUsers,
  approvals: faClipboardCheck,
  reports: faChartColumn,
  administration: faGear,

  /* Showing and hiding the navigation */
  menu: faBars,
  hideNavigation: faChevronLeft,

  /* Screen headers */
  transfers: faArrowRightArrowLeft,
  ledger: faBookOpen,
  pctDeduction: faPercent,
  chartOfAccounts: faListCheck,
  financialStatements: faFileInvoiceDollar,
  administrationPanel: faGear,
  auditTrail: faClockRotateLeft,
  comingSoon: faClipboardCheck,
  search: faMagnifyingGlass,
  newEntry: faPlus,
  moveMoney: faRightLeft,

  /* Accounts and people */
  account: faWallet,
  directory: faUsers,

  /* Status */
  balanced: faCircleCheck,
  unbalanced: faCircleXmark,
  warning: faTriangleExclamation,

  /* Actions */
  delete: faTrashCan,
  previousPage: faChevronLeft,
  nextPage: faChevronRight,
  chevronDown: faChevronDown,
  chevronUp: faChevronUp,
} satisfies Record<string, IconDefinition>

/** Every icon a screen is allowed to name. */
export type IconName = keyof typeof ICONS
