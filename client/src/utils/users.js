import { compareByRole } from '@shared/constants.js'

/**
 * The accounts the Users page shows, in order: filtered by scope and search
 * term, then ordered by role — manager, receptionist, guest — whatever the
 * order the API sent them in. Ordering is applied here as well as on the
 * server so the page is correct on its own, including for search results.
 *
 * @param {{ name: string, email: string, role: string }[]} users
 * @param {'all' | 'guest' | 'staff'} scope
 * @param {string} term  already trimmed and lower-cased
 */
export function visibleUsers(users, scope, term) {
  return users
    .filter(
      (user) =>
        (scope === 'all' || (scope === 'guest' ? user.role === 'guest' : user.role !== 'guest')) &&
        (!term || user.name.toLowerCase().includes(term) || user.email.includes(term)),
    )
    .sort(compareByRole)
}
