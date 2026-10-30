import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { Booking } from '../src/models/Booking.js'
import { Room } from '../src/models/Room.js'
import { User } from '../src/models/User.js'
import { seedDatabase } from '../src/seed/seed.js'
import { ResetError, findManager, resetManagerPassword } from '../src/services/resetManagerPassword.js'
import { ACCOUNTS, app, resetDemoData, signIn, startDatabase, stopDatabase } from './helpers.js'

beforeAll(startDatabase)
afterAll(stopDatabase)
beforeEach(resetDemoData)
afterEach(() => {
  delete process.env.SEED_MANAGER_PASSWORD
})

const login = (account) => request(app).post('/api/auth/login').send(account)
const MANAGER = ACCOUNTS.manager.email

/** Every user's id, email and hash — to prove an operation left others untouched. */
const snapshotUsers = async () =>
  (await User.find().select('+passwordHash').sort({ email: 1 })).map((user) => ({
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    passwordHash: user.passwordHash,
    updatedAt: user.updatedAt.toISOString(),
  }))

describe('why the deployed manager login fails (the cause)', () => {
  it('seeds the manager with SEED_MANAGER_PASSWORD, so the README default is rejected', async () => {
    process.env.SEED_MANAGER_PASSWORD = 'Production-Secret-42'
    await seedDatabase()

    const defaultPassword = await login({ email: MANAGER, password: 'Manager123' })
    expect(defaultPassword.status).toBe(401)
    expect(defaultPassword.body.message).toBe('Incorrect email or password.')
    expect((await login({ email: MANAGER, password: 'Production-Secret-42' })).status).toBe(200)
  })

  it('is case-sensitive: "manager123" is not "Manager123"', async () => {
    expect((await login({ email: MANAGER, password: 'manager123' })).status).toBe(401)
    expect((await login({ email: MANAGER, password: 'Manager123' })).status).toBe(200)
  })

  it('never changes an existing manager on later starts, even if the env var changes', async () => {
    process.env.SEED_MANAGER_PASSWORD = 'First-Secret-1'
    await seedDatabase()

    process.env.SEED_MANAGER_PASSWORD = 'Second-Secret-2'
    expect(await seedDatabase({ onlyIfEmpty: true })).toBeNull() // what every server start does

    expect((await login({ email: MANAGER, password: 'First-Secret-1' })).status).toBe(200)
    expect((await login({ email: MANAGER, password: 'Second-Secret-2' })).status).toBe(401)
  })
})

describe('resetManagerPassword', () => {
  const NEW_PASSWORD = 'Reset-Secret-77'

  it('replaces the manager password: new one works, old one no longer does', async () => {
    const result = await resetManagerPassword({ email: MANAGER, password: NEW_PASSWORD })

    expect(result).toEqual({ email: MANAGER, name: 'Hotel Manager', verified: true })
    expect((await login({ email: MANAGER, password: NEW_PASSWORD })).status).toBe(200)
    expect((await login({ email: MANAGER, password: 'Manager123' })).status).toBe(401)
  })

  it('works on a database that was seeded with a different password, and matches case-insensitively on email', async () => {
    process.env.SEED_MANAGER_PASSWORD = 'Lost-Secret-9'
    await seedDatabase()

    await resetManagerPassword({ email: '  Manager@SuiteSpot.test ', password: NEW_PASSWORD })
    expect((await login({ email: MANAGER, password: NEW_PASSWORD })).status).toBe(200)
  })

  it('changes only the manager: every other account, room and booking is untouched and still signs in', async () => {
    const before = await snapshotUsers()
    const counts = { rooms: await Room.countDocuments(), bookings: await Booking.countDocuments(), users: before.length }

    await resetManagerPassword({ email: MANAGER, password: NEW_PASSWORD })

    const after = await snapshotUsers()
    const changed = after.filter((user, index) => JSON.stringify(user) !== JSON.stringify(before[index]))
    expect(changed.map((user) => user.email)).toEqual([MANAGER])
    expect(changed[0].passwordHash).not.toBe(before.find((user) => user.email === MANAGER).passwordHash)
    expect(changed[0].role).toBe('manager')

    expect({ rooms: await Room.countDocuments(), bookings: await Booking.countDocuments(), users: after.length }).toEqual(counts)

    for (const who of ['receptionist', 'guest', 'otherGuest']) {
      expect((await login(ACCOUNTS[who])).status, `${who} can still sign in`).toBe(200)
    }
  })

  it('stores a bcrypt hash, never the password itself', async () => {
    await resetManagerPassword({ email: MANAGER, password: NEW_PASSWORD })
    const { passwordHash } = await User.findOne({ email: MANAGER }).select('+passwordHash')

    expect(passwordHash).toMatch(/^\$2[aby]\$10\$/) // bcrypt, cost 10 — the same as sign-up
    expect(passwordHash).not.toContain(NEW_PASSWORD)
  })

  it('returns and throws nothing that contains the password or the hash', async () => {
    const result = await resetManagerPassword({ email: MANAGER, password: NEW_PASSWORD })
    expect(JSON.stringify(result)).not.toContain(NEW_PASSWORD)

    const error = await resetManagerPassword({ email: MANAGER, password: 'short1' }).catch((caught) => caught)
    expect(error).toBeInstanceOf(ResetError)
    expect(error.message).not.toContain('short1')
  })

  it('refuses a weak password and changes nothing', async () => {
    const before = await snapshotUsers()
    for (const weak of ['', 'short1', 'allletters', '12345678']) {
      await expect(resetManagerPassword({ email: MANAGER, password: weak })).rejects.toBeInstanceOf(ResetError)
    }
    expect(await snapshotUsers()).toEqual(before)
  })

  it('refuses an email that is not a manager — a guest or receptionist can never be reset this way', async () => {
    const before = await snapshotUsers()
    for (const email of [ACCOUNTS.guest.email, ACCOUNTS.receptionist.email, 'nobody@suitespot.test']) {
      await expect(resetManagerPassword({ email, password: NEW_PASSWORD })).rejects.toThrow(/No manager account/)
    }
    expect(await snapshotUsers()).toEqual(before)
    expect((await login(ACCOUNTS.guest)).status).toBe(200)
  })

  it('does not create the manager if it is missing', async () => {
    await User.deleteOne({ email: MANAGER })
    const users = await User.countDocuments()
    await expect(resetManagerPassword({ email: MANAGER, password: NEW_PASSWORD })).rejects.toThrow(/No manager account/)
    expect(await User.countDocuments()).toBe(users)
  })

  it('findManager reports the account without a hash, and only for managers', async () => {
    expect(await findManager(MANAGER)).toMatchObject({ name: 'Hotel Manager', email: MANAGER, isActive: true })
    expect(Object.keys(await findManager(MANAGER))).not.toContain('passwordHash')
    expect(await findManager(ACCOUNTS.guest.email)).toBeNull()
  })

  it('a signed-in manager session still works after the reset (only the password changed)', async () => {
    const manager = await signIn('manager')
    await resetManagerPassword({ email: MANAGER, password: NEW_PASSWORD })
    expect((await manager.get('/api/auth/me')).status).toBe(200)
  })
})
