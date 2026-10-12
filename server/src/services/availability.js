import { ACTIVE_BOOKING_STATUSES } from '../../../shared/constants.js'
import { parseDateOnly } from '../../../shared/dates.js'
import { Booking } from '../models/Booking.js'

/* ===== Availability =====
   The proposal's core change from the Java version: no "rooms left" counters.
   A room is free for a stay when no active booking for it overlaps the stay's
   dates — computed live from the bookings themselves, so it can never drift
   out of step with them. */

function overlapFilter(checkIn, checkOut) {
  return {
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkIn: { $lt: parseDateOnly(checkOut) },
    checkOut: { $gt: parseDateOnly(checkIn) },
  }
}

/** Ids of every room with an active booking overlapping [checkIn, checkOut). */
export function bookedRoomIds(checkIn, checkOut) {
  return Booking.distinct('room', overlapFilter(checkIn, checkOut))
}

/** Whether one room is already taken for any part of the stay. */
export async function isRoomBooked(roomId, checkIn, checkOut, { session } = {}) {
  const clash = await Booking.exists({ room: roomId, ...overlapFilter(checkIn, checkOut) }).session(
    session ?? null,
  )
  return Boolean(clash)
}
