/**
 * What the signed-in account is allowed to reach, and the labels that go with it.
 *
 * The answer is not worked out here. The server sends the list with the session
 * (see `User.permissions`) because it is the only place that knows the rules -
 * see `app/core/permissions.py`. What lives here is the small amount of book-keeping
 * the interface needs: turning that list into a yes/no answer, and naming a role.
 */

import type { Permission, User, UserRole } from '@/api/types'

export const USER_ROLES: readonly UserRole[] = ['accountant', 'secretary', 'admin']

/** Capitalised names, matching the `role_label` the server sends. */
export const ROLE_LABELS: Record<UserRole, string> = {
  accountant: 'Accountant',
  secretary: 'Secretary',
  admin: 'Administrator',
}

/**
 * Whether this account holds a permission.
 *
 * Returns false for a signed-out user, so a caller that forgets to check the
 * session shows nothing rather than showing everything.
 */
export function can(user: User | null, permission: Permission): boolean {
  return user !== null && user.permissions.includes(permission)
}

/** Whether this account holds every one of these permissions. */
export function canAll(user: User | null, permissions: readonly Permission[]): boolean {
  return permissions.every((permission) => can(user, permission))
}