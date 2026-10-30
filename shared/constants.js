/* ===== Hotel rules shared by client and server =====
   Plain, dependency-free ES modules so the browser and Node import the exact
   same numbers: the price the guest sees before booking is computed by the
   same function the server uses to charge them. */

export const ROLES = ['guest', 'receptionist', 'manager']

export const ROOM_TYPES = ['Single', 'Double', 'King', 'Suite']

/**
 * Default nightly rate and capacity per type, in pesos. Used by the seed data
 * and to prefill the manager's "New Room" form; each room can still be
 * priced individually. Default values — see docs/CHECKLIST.md.
 */
export const ROOM_TYPE_DEFAULTS = {
  Single: { pricePerNight: 1500, maxOccupancy: 1 },
  Double: { pricePerNight: 2500, maxOccupancy: 2 },
  King: { pricePerNight: 3500, maxOccupancy: 3 },
  Suite: { pricePerNight: 6000, maxOccupancy: 4 },
}
export const ROOM_STATUSES = ['available', 'maintenance']
export const TOTAL_FLOORS = 8
export const ROOMS_PER_FLOOR = 10

export const MEAL_ADDONS = ['none', 'lunch', 'dinner', 'both']

/** Per guest, per night, in pesos. Default values — see docs/CHECKLIST.md. */
export const MEAL_PRICES = { lunch: 350, dinner: 450 }

export const PAYMENT_STATUSES = ['full', 'partial']
/** A partial payment is 30% of the total, settled in full at check-out. */
export const PARTIAL_RATE = 0.3

export const BOOKING_STATUSES = ['confirmed', 'checked-in', 'completed', 'cancelled']
/** Bookings that still hold their room for the dates they cover. */
export const ACTIVE_BOOKING_STATUSES = ['confirmed', 'checked-in']

export const MAX_NIGHTS = 30

/** "Today" is the hotel's today, not the server's (Render runs in UTC). */
export const HOTEL_TIME_ZONE = 'Asia/Manila'
