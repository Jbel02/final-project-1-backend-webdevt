/**
 * Tab bar / sidebar destinations per role — the proposal's three roles plus
 * signed-out visitors (who can browse rooms, which is public).
 *
 * Receptionists get Rooms too: browsing is public, and the front desk needs
 * to answer "what's free this weekend?" — but their Rooms tab is the same
 * read-only list a guest sees, with no management controls.
 */
const ROOMS = { to: '/rooms', label: 'Rooms', icon: 'bed' }
const BOOKINGS = { to: '/bookings', label: 'Bookings', icon: 'calendar' }
const USERS = { to: '/users', label: 'Users', icon: 'people' }
const PROFILE = { to: '/profile', label: 'Profile', icon: 'person' }
const SIGN_IN = { to: '/signin', label: 'Sign In', icon: 'person' }

const NAV_BY_ROLE = {
  guest: [ROOMS, BOOKINGS, PROFILE],
  receptionist: [BOOKINGS, ROOMS, PROFILE],
  manager: [ROOMS, BOOKINGS, USERS, PROFILE],
}

export function navItemsFor(user) {
  return user ? NAV_BY_ROLE[user.role] : [ROOMS, SIGN_IN]
}

/** Where "/" lands for each role. */
export function homePathFor(user) {
  return user?.role === 'receptionist' ? '/bookings' : '/rooms'
}
