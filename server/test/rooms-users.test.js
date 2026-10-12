import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { addDays, todayDateOnly } from '../../shared/dates.js'
import { anonymous, resetDemoData, roomByNumber, signIn, startDatabase, stopDatabase } from './helpers.js'

beforeAll(startDatabase)
afterAll(stopDatabase)
beforeEach(resetDemoData)

const today = todayDateOnly()

describe('room search', () => {
  it('hides maintenance rooms from guests but shows all 80 to the manager', async () => {
    const publicList = (await anonymous().get('/api/rooms')).body.rooms
    expect(publicList).toHaveLength(78)
    expect(publicList.some((room) => room.roomNumber === '207')).toBe(false)

    const managerList = (await (await signIn('manager')).get('/api/rooms')).body.rooms
    expect(managerList).toHaveLength(80)
  })

  it('filters by date range, capacity and price together', async () => {
    const stay = `checkIn=${today}&checkOut=${addDays(today, 2)}`
    const { body } = await anonymous().get(`/api/rooms?${stay}&guests=2&minPrice=2000&maxPrice=3000`)

    expect(body.rooms.length).toBeGreaterThan(0)
    expect(body.rooms.every((room) => room.type === 'Double')).toBe(true)
    // 506 is seeded as booked from today, so it must not be offered.
    expect(body.rooms.some((room) => room.roomNumber === '506')).toBe(false)
  })

  it('rejects a search with check-out before check-in', async () => {
    const { status, body } = await anonymous().get(
      `/api/rooms?checkIn=${addDays(today, 3)}&checkOut=${addDays(today, 1)}`,
    )
    expect(status).toBe(400)
    expect(body.errors.checkOut).toBeDefined()
  })
})

describe('room management', () => {
  const newRoom = {
    roomNumber: '811',
    floor: 8,
    type: 'Suite',
    pricePerNight: 7500,
    maxOccupancy: 4,
    photoUrl: 'https://example.com/suite.jpg',
    status: 'available',
  }

  it('adds, edits and deletes a room', async () => {
    const manager = await signIn('manager')
    const created = await manager.post('/api/rooms').send(newRoom).expect(201)

    const edited = await manager
      .put(`/api/rooms/${created.body.room.id}`)
      .send({ ...newRoom, pricePerNight: 8000, status: 'maintenance' })
      .expect(200)
    expect(edited.body.room).toMatchObject({ pricePerNight: 8000, status: 'maintenance' })

    await manager.delete(`/api/rooms/${created.body.room.id}`).expect(204)
  })

  it('rejects duplicate room numbers and invalid fields', async () => {
    const manager = await signIn('manager')
    const duplicate = await manager.post('/api/rooms').send({ ...newRoom, roomNumber: '101', floor: 1 })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.errors.roomNumber).toBeDefined()

    const invalid = await manager.post('/api/rooms').send({ ...newRoom, pricePerNight: -5, type: 'Penthouse' })
    expect(invalid.status).toBe(400)
    expect(Object.keys(invalid.body.errors)).toEqual(expect.arrayContaining(['pricePerNight', 'type']))
  })

  it('refuses to delete a room with a current or upcoming stay', async () => {
    const manager = await signIn('manager')
    const occupied = await roomByNumber('102')
    const { status, body } = await manager.delete(`/api/rooms/${occupied.id}`)
    expect(status).toBe(409)
    expect(body.message).toMatch(/Maintenance/)
  })

  it('keeps receipts intact after a room price change', async () => {
    const manager = await signIn('manager')
    const room = await roomByNumber('305')
    const bookedAt = room.pricePerNight
    await manager.put(`/api/rooms/${room.id}`).send({ ...room.toJSON(), pricePerNight: 9999 }).expect(200)

    const juan = await signIn('guest')
    const past = (await juan.get('/api/bookings/mine')).body.bookings.find(
      (booking) => booking.roomSnapshot.roomNumber === '305',
    )
    expect(past.roomSnapshot.pricePerNight).toBe(bookedAt)
    expect(past.room.pricePerNight).toBe(9999)
  })
})

describe('accounts', () => {
  it('registers guests only, whatever role is sent', async () => {
    const { status, body, headers } = await anonymous()
      .post('/api/auth/register')
      .send({ name: 'New Guest', email: 'new@example.com', password: 'abcd1234', role: 'manager' })
    expect(status).toBe(201)
    expect(body.user.role).toBe('guest')
    expect(body.user.passwordHash).toBeUndefined()
    expect(headers['set-cookie'][0]).toMatch(/HttpOnly/i)
  })

  it('rejects a duplicate email and a wrong password', async () => {
    const duplicate = await anonymous()
      .post('/api/auth/register')
      .send({ name: 'Copy', email: 'GUEST@suitespot.test', password: 'abcd1234' })
    expect(duplicate.status).toBe(409)

    const wrong = await anonymous()
      .post('/api/auth/login')
      .send({ email: 'guest@suitespot.test', password: 'not-it-123' })
    expect(wrong.status).toBe(401)
  })

  it('lets anyone edit their own profile', async () => {
    const juan = await signIn('guest')
    const { body } = await juan
      .patch('/api/users/me')
      .send({ name: 'Juan D. Cruz', email: 'guest@suitespot.test', contact: '+63 917 999 0000', address: 'Pasig City' })
      .expect(200)
    expect(body.user).toMatchObject({ name: 'Juan D. Cruz', address: 'Pasig City' })
  })

  it('creates a receptionist who can then sign in and see all bookings', async () => {
    const manager = await signIn('manager')
    await manager
      .post('/api/users/receptionist')
      .send({ name: 'Night Desk', email: 'night@suitespot.test', password: 'Night1234' })
      .expect(201)

    const login = await anonymous()
      .post('/api/auth/login')
      .send({ email: 'night@suitespot.test', password: 'Night1234' })
    expect(login.body.user.role).toBe('receptionist')
  })

  it('deactivation ends sign-in and the current session immediately', async () => {
    const manager = await signIn('manager')
    const desk = await signIn('receptionist')
    const deskUser = (await desk.get('/api/auth/me')).body.user

    await manager.patch(`/api/users/${deskUser.id}/deactivate`).expect(200)
    expect((await desk.get('/api/auth/me')).status).toBe(401)

    const login = await anonymous()
      .post('/api/auth/login')
      .send({ email: 'frontdesk@suitespot.test', password: 'Desk12345' })
    expect(login.status).toBe(403)

    await manager.patch(`/api/users/${deskUser.id}/activate`).expect(200)
  })

  it('protects managers and guests with active stays from deletion', async () => {
    const manager = await signIn('manager')
    const users = (await manager.get('/api/users')).body.users
    const self = users.find((user) => user.role === 'manager')
    const juan = users.find((user) => user.email === 'guest@suitespot.test')
    const desk = users.find((user) => user.role === 'receptionist')

    expect((await manager.delete(`/api/users/${self.id}`)).status).toBe(409)
    expect((await manager.delete(`/api/users/${juan.id}`)).status).toBe(409)
    await manager.delete(`/api/users/${desk.id}`).expect(204)
  })
})
