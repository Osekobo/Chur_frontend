/**
 * A token that says "this is the same form, submitting the same entry again".
 *
 * Sent with an entry so the server can tell a second Save from a second entry:
 * a double-clicked button, or a retry after the connection dropped while the
 * first attempt had already been written, returns the entry that exists instead
 * of adding another row of money.
 *
 * Held by the form for as long as the entry is being typed, and replaced once
 * the save has gone through - see MoneyPage.
 */

export function newRequestId(): string {
  // `crypto.randomUUID` needs a secure context. The app is served over https, but
  // a development build opened on a LAN address would lose it, and the token is
  // only ever a tie-break between two saves, so a fallback costs nothing.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}