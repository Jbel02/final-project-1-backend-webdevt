import { describe, expect, it } from 'vitest'
import {
  addDays,
  nightsBetween,
  parseDateOnly,
  rangesOverlap,
  todayDateOnly,
} from '../../shared/dates.js'
import { ROLE_ORDER, compareByRole } from '../../shared/constants.js'
import { mealRate, quoteBooking } from '../../shared/pricing.js'
import {
  validateBooking,
  validateRegistration,
  validateRoom,
  validateStayDates,
} from '../../shared/validation.js'

describe('dates', () => {
  it('parses real dates and rejects rollovers', () => {
    expect(parseDateOnly('2026-10-12')?.toISOString()).toBe('2026-10-12T00:00:00.000Z')
    expect(parseDateOnly('2026-02-31')).toBeNull()
    expect(parseDateOnly('12/10/2026')).toBeNull()
  })

  it('counts nights across month and year boundaries', () => {
    expect(nightsBetween('2026-10-30', '2026-11-02')).toBe(3)
    expect(nightsBetween('2026-12-31', '2027-01-01')).toBe(1)
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('treats check-out day as free for the next guest', () => {
    expect(rangesOverlap('2026-10-10', '2026-10-12', '2026-10-12', '2026-10-14')).toBe(false)
    expect(rangesOverlap('2026-10-10', '2026-10-13', '2026-10-12', '2026-10-14')).toBe(true)
    expect(rangesOverlap('2026-10-11', '2026-10-12', '2026-10-10', '2026-10-14')).toBe(true)
  })

  it("uses the hotel's calendar day, not UTC", () => {
    // 20:00 UTC on 11 Oct is already 04:00 on 12 Oct in Manila.
    expect(todayDateOnly(new Date('2026-10-11T20:00:00Z'))).toBe('2026-10-12')
  })
})

describe('pricing', () => {
  it('adds meals per guest per night', () => {
    expect(mealRate('none')).toBe(0)
    expect(mealRate('both')).toBe(800)
    const quote = quoteBooking({
      pricePerNight: 3500,
      nights: 3,
      guests: 2,
      mealAddons: 'dinner',
      paymentStatus: 'full',
    })
    expect(quote).toMatchObject({
      roomTotal: 10500,
      mealTotal: 2700,
      totalAmount: 13200,
      paidAmount: 13200,
      balance: 0,
    })
  })

  it('charges 30% now for a partial payment', () => {
    const quote = quoteBooking({
      pricePerNight: 1500,
      nights: 1,
      guests: 1,
      mealAddons: 'none',
      paymentStatus: 'partial',
    })
    expect(quote.paidAmount).toBe(450)
    expect(quote.balance).toBe(1050)
  })
})

describe('validation', () => {
  it('requires a strong-enough password and a valid email', () => {
    const errors = validateRegistration({ name: 'A', email: 'nope', password: 'short' })
    expect(errors.email).toBeDefined()
    expect(errors.password).toBeDefined()
    expect(
      validateRegistration({ name: 'Ana', email: 'ana@example.com', password: 'abcd1234' }),
    ).toEqual({})
  })

  it('rejects stays in the past or with check-out before check-in', () => {
    const today = '2026-10-12'
    expect(validateStayDates({ checkIn: '2026-10-11', checkOut: '2026-10-13' }, { today }).checkIn).toBeDefined()
    expect(validateStayDates({ checkIn: '2026-10-13', checkOut: '2026-10-13' }, { today }).checkOut).toBeDefined()
    expect(validateStayDates({ checkIn: '2026-10-12', checkOut: '2026-10-13' }, { today })).toEqual({})
  })

  it('caps guests at the room capacity', () => {
    const errors = validateBooking(
      { checkIn: '2026-10-12', checkOut: '2026-10-13', guests: 3, mealAddons: 'none', paymentStatus: 'full' },
      { today: '2026-10-12', maxOccupancy: 2 },
    )
    expect(errors.guests).toMatch(/up to 2 guests/)
  })

  it("keeps a room number on its own floor", () => {
    const room = { roomNumber: '305', floor: 4, type: 'King', pricePerNight: 3500, maxOccupancy: 3, status: 'available' }
    expect(validateRoom(room).roomNumber).toMatch(/floor 4/)
    expect(validateRoom({ ...room, floor: 3 })).toEqual({})
  })
})

describe('role order', () => {
  it('is manager, receptionist, guest', () => {
    expect(ROLE_ORDER).toEqual(['manager', 'receptionist', 'guest'])
  })

  it('sorts by role only, keeps the incoming order within a role, and puts an unknown role last', () => {
    const accounts = [
      { id: 1, role: 'receptionist' },
      { id: 2, role: 'guest' },
      { id: 3, role: 'mystery' },
      { id: 4, role: 'manager' },
      { id: 5, role: 'receptionist' },
    ]
    expect([...accounts].sort(compareByRole).map((account) => account.id)).toEqual([4, 1, 5, 2, 3])
  })
})
