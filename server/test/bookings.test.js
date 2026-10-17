import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { addDays, todayDateOnly } from '../../shared/dates.js'
import { Booking } from '../src/models/Booking.js'
import { resetDemoData, roomByNumber, signIn, startDatabase, stopDatabase } from './helpers.js'

beforeAll(startDatabase)
afterAll(stopDatabase)
beforeEach(resetDemoData)

const today = todayDateOnly()

function bookingBody(room, overrides = {}) {
  return {
    room: room.id,
    checkIn: addDays(today, 40),
    checkOut: addDays(today, 43),
    guests: 2,
    mealAddons: 'dinner',
    paymentStatus: 'partial',
    ...overrides,
  }
}

describe('creating a booking', () => {
  it('prices the stay on the server and ignores amounts sent by the client', async () => {
    const guest = await signIn('guest')
    const room = await roomByNumber('308') // King, ₱3,500, up to 3

    const { status, body } = await guest
      .post('/api/bookings')
      .send(bookingBody(room, { totalAmount: 1, paidAmount: 1 }))

    expect(status).toBe(201)
    // 3 nights × 3,500 + 2 guests × 3 nights × 450 dinner = 13,200
    expect(body.booking).toMatchObject({
      totalAmount: 13200,
      paidAmount: 3960,
      balance: 9240,
      paymentStatus: 'partial',
      status: 'confirmed',
      roomSnapshot: { roomNumber: '308', type: 'King', pricePerNight: 3500 },
    })
    expect(body.booking.transactionId).toMatch(/^SS-\d{6}-[2-9A-HJ-NP-Z]{6}$/)
  })

  it('rejects dates that overlap an existing stay in the same room', async () => {
    const guest = await signIn('guest')
    const room = await roomByNumber('308')
    await guest.post('/api/bookings').send(bookingBody(room)).expect(201)

    const overlapping = bookingBody(room, {
      checkIn: addDays(today, 42),
      checkOut: addDays(today, 45),
    })
    const { status } = await (await signIn('otherGuest')).post('/api/bookings').send(overlapping)
    expect(status).toBe(409)

    // Starting on the other guest's check-out day is fine.
    const backToBack = bookingBody(room, {
      checkIn: addDays(today, 43),
      checkOut: addDays(today, 44),
    })
    await (await signIn('otherGuest')).post('/api/bookings').send(backToBack).expect(201)
  })

  it('lets only one of two simultaneous bookings for the same room through', async () => {
    const [first, second] = await Promise.all([signIn('guest'), signIn('otherGuest')])
    const room = await roomByNumber('309')

    const results = await Promise.all([
      first.post('/api/bookings').send(bookingBody(room)),
      second.post('/api/bookings').send(bookingBody(room)),
    ])

    expect(results.map((result) => result.status).sort()).toEqual([201, 409])
    expect(await Booking.countDocuments({ room: room._id, status: 'confirmed' })).toBe(1)
  })

  it('enforces capacity, past dates and maintenance rooms', async () => {
    const guest = await signIn('guest')
    const single = await roomByNumber('103')

    const tooMany = await guest.post('/api/bookings').send(bookingBody(single, { guests: 2 }))
    expect(tooMany.status).toBe(400)
    expect(tooMany.body.errors.guests).toMatch(/up to 1 guest/)

    const past = await guest
      .post('/api/bookings')
      .send(bookingBody(single, { guests: 1, checkIn: addDays(today, -2), checkOut: today }))
    expect(past.body.errors.checkIn).toBeDefined()

    const maintenance = await roomByNumber('207')
    const closed = await guest.post('/api/bookings').send(bookingBody(maintenance, { guests: 1 }))
    expect(closed.status).toBe(404)
  })
})

describe('the stay lifecycle', () => {
  it('checks in on arrival day and settles a partial balance at check-out', async () => {
    const desk = await signIn('receptionist')
    // Seeded: Maria arrives today in 506, paid in full.
    const { body } = await desk.get(`/api/bookings?date=${today}&status=confirmed`)
    const arriving = body.bookings.find((booking) => booking.roomSnapshot.roomNumber === '506')

    const checkedIn = await desk.patch(`/api/bookings/${arriving.id}/checkin`).expect(200)
    expect(checkedIn.body.booking.status).toBe('checked-in')

    // Seeded: Juan is in 102 on a partial payment.
    const inHouse = (await desk.get('/api/bookings?status=checked-in')).body.bookings.find(
      (booking) => booking.roomSnapshot.roomNumber === '102',
    )
    expect(inHouse.balance).toBeGreaterThan(0)

    const checkedOut = await desk.patch(`/api/bookings/${inHouse.id}/checkout`).expect(200)
    expect(checkedOut.body.booking).toMatchObject({
      status: 'completed',
      balance: 0,
      paymentStatus: 'full',
      paidAmount: inHouse.totalAmount,
    })
  })

  it('refuses to check in before the arrival date', async () => {
    const desk = await signIn('receptionist')
    const future = await Booking.findOne({ 'roomSnapshot.roomNumber': '810' })
    const { status, body } = await desk.patch(`/api/bookings/${future.id}/checkin`)
    expect(status).toBe(409)
    expect(body.message).toMatch(/Check-in opens that day/)
  })

  it('refuses to check out a confirmed booking', async () => {
    const desk = await signIn('receptionist')
    const confirmed = await Booking.findOne({ 'roomSnapshot.roomNumber': '506' })
    const { status, body } = await desk.patch(`/api/bookings/${confirmed.id}/checkout`)
    expect(status).toBe(409)
    expect(body.message).toBe('Only a checked-in guest can be checked out.')
  })

  it('refuses to check in a completed booking', async () => {
    const desk = await signIn('receptionist')
    const completed = await Booking.findOne({ 'roomSnapshot.roomNumber': '305' })
    const { status, body } = await desk.patch(`/api/bookings/${completed.id}/checkin`)
    expect(status).toBe(409)
    expect(body.message).toBe('This booking is completed, so it can’t be checked in.')
  })
})

describe('cancelling', () => {
  it('lets a guest cancel only their own upcoming booking', async () => {
    const juan = await signIn('guest')
    const maria = await signIn('otherGuest')
    const juansFuture = await Booking.findOne({ 'roomSnapshot.roomNumber': '810' })

    // Someone else's booking is invisible, not just forbidden.
    expect((await maria.patch(`/api/bookings/${juansFuture.id}/cancel`)).status).toBe(404)

    const { body } = await juan.patch(`/api/bookings/${juansFuture.id}/cancel`).expect(200)
    expect(body.booking.status).toBe('cancelled')

    // Already checked in → no longer cancellable.
    const inHouse = await Booking.findOne({ 'roomSnapshot.roomNumber': '102' })
    expect((await juan.patch(`/api/bookings/${inHouse.id}/cancel`)).status).toBe(409)
  })

  it('frees the room for those dates once cancelled', async () => {
    const juan = await signIn('guest')
    const booking = await Booking.findOne({ 'roomSnapshot.roomNumber': '810' })
    const room = await roomByNumber('810')
    const stay = `checkIn=${addDays(today, 14)}&checkOut=${addDays(today, 17)}`

    expect((await juan.get(`/api/rooms/${room.id}?${stay}`)).body.availability.available).toBe(false)
    await juan.patch(`/api/bookings/${booking.id}/cancel`).expect(200)
    expect((await juan.get(`/api/rooms/${room.id}?${stay}`)).body.availability.available).toBe(true)
  })

  it('lets the manager cancel any upcoming booking', async () => {
    const manager = await signIn('manager')
    const booking = await Booking.findOne({ 'roomSnapshot.roomNumber': '201' })
    await manager.patch(`/api/bookings/${booking.id}/cancel`).expect(200)
  })
})

describe('staff filters', () => {
  it('filters by payment status', async () => {
    const desk = await signIn('receptionist')
    const { body } = await desk.get('/api/bookings?paymentStatus=partial')
    expect(body.bookings.length).toBeGreaterThan(0)
    expect(body.bookings.every((booking) => booking.paymentStatus === 'partial')).toBe(true)
  })
})
