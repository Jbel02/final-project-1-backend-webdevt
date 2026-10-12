import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anonymous, resetDemoData, roomByNumber, signIn, startDatabase, stopDatabase } from './helpers.js'

/**
 * The proposal's access column, endpoint by endpoint, for every kind of
 * caller. Each case only checks that the role gate lets the request through
 * (anything but 401/403) or stops it (exactly 401 for a visitor, 403 for a
 * signed-in user without the role) — the behaviour behind the gate is
 * covered in the other test files.
 */

const ids = {}
const agents = {}

beforeAll(async () => {
  await startDatabase()
  await resetDemoData()
  agents.guest = await signIn('guest')
  agents.receptionist = await signIn('receptionist')
  agents.manager = await signIn('manager')

  ids.room = (await roomByNumber('101')).id
  ids.booking = (await agents.guest.get('/api/bookings/mine')).body.bookings[0].id
  // Account-level actions target a guest none of the agents above is signed
  // in as, so deactivating them can't break the rest of the matrix.
  ids.user = (await agents.manager.get('/api/users?q=carlo')).body.users[0].id
})

afterAll(stopDatabase)

const ALL = ['anonymous', 'guest', 'receptionist', 'manager']

// [method, route as written in the proposal, concrete path, roles allowed]
const MATRIX = [
  ['get', '/api/rooms', () => '/api/rooms', ALL],
  ['get', '/api/rooms/:id', () => `/api/rooms/${ids.room}`, ALL],
  ['post', '/api/rooms', () => '/api/rooms', ['manager']],
  ['put', '/api/rooms/:id', () => `/api/rooms/${ids.room}`, ['manager']],
  ['delete', '/api/rooms/:id', () => '/api/rooms/000000000000000000000000', ['manager']],
  ['post', '/api/bookings', () => '/api/bookings', ['guest']],
  ['get', '/api/bookings/mine', () => '/api/bookings/mine', ['guest']],
  ['get', '/api/bookings', () => '/api/bookings', ['receptionist', 'manager']],
  ['get', '/api/bookings/:id', () => `/api/bookings/${ids.booking}`, ['guest', 'receptionist', 'manager']],
  ['patch', '/api/bookings/:id/checkin', () => `/api/bookings/${ids.booking}/checkin`, ['receptionist', 'manager']],
  ['patch', '/api/bookings/:id/checkout', () => `/api/bookings/${ids.booking}/checkout`, ['receptionist', 'manager']],
  ['patch', '/api/bookings/:id/cancel', () => `/api/bookings/${ids.booking}/cancel`, ['guest', 'manager']],
  ['get', '/api/users', () => '/api/users', ['manager']],
  ['post', '/api/users/receptionist', () => '/api/users/receptionist', ['manager']],
  ['patch', '/api/users/:id/deactivate', () => `/api/users/${ids.user}/deactivate`, ['manager']],
  ['delete', '/api/users/:id', () => `/api/users/${ids.user}`, ['manager']],
  ['patch', '/api/users/me', () => '/api/users/me', ['guest', 'receptionist', 'manager']],
  ['post', '/api/auth/logout', () => '/api/auth/logout', ['guest', 'receptionist', 'manager']],
  ['get', '/api/auth/me', () => '/api/auth/me', ['guest', 'receptionist', 'manager']],
]

describe('role-based access', () => {
  for (const [method, route, path, allowed] of MATRIX) {
    describe(`${method.toUpperCase()} ${route}`, () => {
      for (const role of ALL) {
        const expectAllowed = allowed.includes(role)
        it(`${role}: ${expectAllowed ? 'allowed' : 'blocked'}`, async () => {
          // Logout would end the shared session, so it gets a throwaway one.
          const client =
            role === 'anonymous'
              ? anonymous()
              : route === '/api/auth/logout'
                ? await signIn(role)
                : agents[role]
          // Empty bodies: a 400 (validation) or 409 (state) still proves the
          // request got past the role gate.
          const { status } = await client[method](path()).send({})
          if (expectAllowed) expect([401, 403]).not.toContain(status)
          else expect(status).toBe(role === 'anonymous' ? 401 : 403)
        })
      }
    })
  }
})
