/**
 * Money formatting.
 *
 * The backend stores money as `Numeric(14,2)` and Pydantic serialises `Decimal`
 * as a JSON string ("1000.00"), so every amount arrives as a string. These
 * helpers convert once, at the edge, so screens can do plain arithmetic.
 */

/** Parse a value that may arrive as a decimal string, number, null or undefined. */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Sum a list of money-like values. */
export function sum(values: (string | number | null | undefined)[]): number {
  return values.reduce<number>((total, value) => total + toNumber(value), 0)
}

/**
 * Format for display, matching mm.html: "-KSh 1,234" with no decimals.
 */
export function money(value: string | number | null | undefined): string {
  const amount = toNumber(value)
  const sign = amount < 0 ? '-' : ''
  return `${sign}KSh ${Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

/** Sum a list of transactions by predicate. */
export function totalOf<T>(
  items: T[],
  amountOf: (item: T) => string | number,
  predicate?: (item: T) => boolean,
): number {
  return sum(items.filter((item) => (predicate ? predicate(item) : true)).map(amountOf))
}
