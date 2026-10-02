/**
 * Password rules, mirroring PASSWORD_MIN_LENGTH and _validate_password in
 * app/schemas/auth.py.
 *
 * The server is the authority and always re-checks; this only lets a form
 * complain before the round trip.
 */

export const PASSWORD_MIN_LENGTH = 8

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`
  }
  if (!/[a-z]/i.test(password)) return 'Password must contain at least one letter.'
  if (!/\d/.test(password)) return 'Password must contain at least one number.'
  return null
}