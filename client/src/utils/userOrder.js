/* ===== Account ordering for the Users page =====
   Managers first, receptionists last, so the list reads the same no matter
   when accounts were created or what they are called. Guests sit between the
   two, which keeps every view consistent: the Staff filter shows managers
   then receptionists, and All keeps managers on top and receptionists at the
   bottom. */

const ROLE_RANK = { manager: 0, guest: 1, receptionist: 2 }

/** Unknown roles sort after everything we know about. */
const rankOf = (role) => ROLE_RANK[role] ?? Object.keys(ROLE_RANK).length

/**
 * Returns a new array ordered by account role only. Array#sort is stable, so
 * accounts with the same role keep the order the server sent them in.
 */
export function sortUsersByRole(users) {
  return [...users].sort((a, b) => rankOf(a.role) - rankOf(b.role))
}
