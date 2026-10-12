import { Router } from 'express'
import mongoose from 'mongoose'
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../../../shared/constants.js'
import { nightsBetween, parseDateOnly, todayDateOnly, toDateOnly } from '../../../shared/dates.js'
import { quoteBooking } from '../../../shared/pricing.js'
import { validateBooking } from '../../../shared/validation.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { HttpError, assertValid } from '../middleware/errors.js'
import { Booking } from '../models/Booking.js'
import { Room } from '../models/Room.js'
import { isRoomBooked } from '../services/availability.js'

export const bookingsRouter = Router()

bookingsRouter.use(authenticate)

const STAFF = ['receptionist', 'manager']
const ROOM_FIELDS = 'roomNumber type floor photoUrl pricePerNight maxOccupancy status'
const GUEST_FIELDS = 'name email contact isActive'

const shortDate = (dateOnly) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(
    parseDateOnly(dateOnly),
  )

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function withDetails(query) {
  return query.populate('room', ROOM_FIELDS).populate('guest', GUEST_FIELDS)
}

/** Loads a booking the current user is allowed to see, or throws. */
async function findVisibleBooking(req) {
  const booking = await withDetails(Booking.findById(req.params.id))
  if (!booking) throw new HttpError(404, 'We couldn’t find that booking.')

  const isOwner = booking.guest?._id?.equals(req.user._id)
  if (!STAFF.includes(req.user.role) && !isOwner) {
    // 404 rather than 403: a guest shouldn't learn that someone else's
    // booking reference exists.
    throw new HttpError(404, 'We couldn’t find that booking.')
  }
  return booking
}

/**
 * POST /api/bookings — guest. Prices are recomputed here from the room's
 * current rate; nothing the client sends about money is used.
 */
bookingsRouter.post('/', requireRole('guest'), async (req, res) => {
  const room = mongoose.isValidObjectId(req.body.room) ? await Room.findById(req.body.room) : null
  if (!room || room.status !== 'available') {
    throw new HttpError(404, 'This room isn’t available right now.')
  }

  const today = todayDateOnly()
  assertValid(validateBooking(req.body, { today, maxOccupancy: room.maxOccupancy }))

  const { checkIn, checkOut, mealAddons, paymentStatus } = req.body
  const guests = Number(req.body.guests)
  const quote = quoteBooking({
    pricePerNight: room.pricePerNight,
    nights: nightsBetween(checkIn, checkOut),
    guests,
    mealAddons,
    paymentStatus,
  })

  let bookingId
  // ➕ Double-booking guard. Checking for an overlap and then inserting is a
  // race on its own: two guests can both see the room free and both insert.
  // Inside a transaction, each attempt also writes the room document, so two
  // concurrent attempts collide on that write — MongoDB aborts one, Mongoose
  // retries it, and the retry's overlap check now sees the winner's booking.
  await mongoose.connection.transaction(async (session) => {
    await Room.updateOne(
      { _id: room._id },
      { $set: { updatedAt: new Date() } },
      { session, timestamps: false },
    )

    if (await isRoomBooked(room.id, checkIn, checkOut, { session })) {
      throw new HttpError(
        409,
        'This room was just booked for some of those dates. Try different dates or another room.',
      )
    }

    const [booking] = await Booking.create(
      [
        {
          guest: req.user._id,
          room: room._id,
          checkIn: parseDateOnly(checkIn),
          checkOut: parseDateOnly(checkOut),
          guests,
          mealAddons,
          paymentStatus,
          totalAmount: quote.totalAmount,
          paidAmount: quote.paidAmount,
          balance: quote.balance,
          roomSnapshot: {
            roomNumber: room.roomNumber,
            type: room.type,
            floor: room.floor,
            pricePerNight: room.pricePerNight,
          },
          guestSnapshot: { name: req.user.name, email: req.user.email },
        },
      ],
      { session },
    )
    bookingId = booking._id
  })

  const booking = await withDetails(Booking.findById(bookingId))
  res.status(201).json({ booking })
})

/** GET /api/bookings/mine — guest. */
bookingsRouter.get('/mine', requireRole('guest'), async (req, res) => {
  const bookings = await withDetails(Booking.find({ guest: req.user._id }).sort({ checkIn: -1 }))
  res.json({ bookings })
})

/**
 * GET /api/bookings — receptionist, manager. Filters: date (stays that cover
 * that day, arrival and departure days included), paymentStatus, status, and
 * a free-text q over reference, guest and room number.
 */
bookingsRouter.get('/', requireRole(...STAFF), async (req, res) => {
  const filter = {}
  const { date, paymentStatus, status, q } = req.query

  if (date) {
    const day = parseDateOnly(date)
    if (!day) throw new HttpError(400, 'Choose a valid date.', { date: 'Choose a valid date.' })
    filter.checkIn = { $lte: day }
    filter.checkOut = { $gte: day }
  }
  if (PAYMENT_STATUSES.includes(paymentStatus)) filter.paymentStatus = paymentStatus
  if (BOOKING_STATUSES.includes(status)) filter.status = status
  if (typeof q === 'string' && q.trim()) {
    const pattern = new RegExp(escapeRegex(q.trim()), 'i')
    filter.$or = [
      { transactionId: pattern },
      { 'guestSnapshot.name': pattern },
      { 'guestSnapshot.email': pattern },
      { 'roomSnapshot.roomNumber': pattern },
    ]
  }

  const bookings = await withDetails(
    Booking.find(filter)
      .sort(date ? { checkIn: 1 } : { checkIn: -1 })
      .limit(500),
  )
  res.json({ bookings })
})

/** ➕ GET /api/bookings/:id — owner or staff. Powers the receipt screen. */
bookingsRouter.get('/:id', async (req, res) => {
  res.json({ booking: await findVisibleBooking(req) })
})

/** PATCH /api/bookings/:id/checkin — receptionist, manager. */
bookingsRouter.patch('/:id/checkin', requireRole(...STAFF), async (req, res) => {
  const booking = await findVisibleBooking(req)
  if (booking.status !== 'confirmed') {
    throw new HttpError(409, `This booking is ${booking.status.replace('-', ' ')}, so it can’t be checked in.`)
  }

  const today = todayDateOnly()
  const checkIn = toDateOnly(booking.checkIn)
  const checkOut = toDateOnly(booking.checkOut)
  if (today < checkIn) {
    throw new HttpError(409, `This stay starts on ${shortDate(checkIn)}. Check-in opens that day.`)
  }
  if (today >= checkOut) {
    throw new HttpError(409, 'This stay’s dates have already passed.')
  }

  booking.status = 'checked-in'
  await booking.save()
  res.json({ booking })
})

/**
 * PATCH /api/bookings/:id/checkout — receptionist, manager. A partial (30%)
 * booking settles its balance here, so every completed stay is fully paid.
 */
bookingsRouter.patch('/:id/checkout', requireRole(...STAFF), async (req, res) => {
  const booking = await findVisibleBooking(req)
  if (booking.status !== 'checked-in') {
    throw new HttpError(409, 'Only a checked-in guest can be checked out.')
  }

  booking.status = 'completed'
  booking.paidAmount = booking.totalAmount
  booking.balance = 0
  booking.paymentStatus = 'full'
  await booking.save()
  res.json({ booking })
})

/**
 * PATCH /api/bookings/:id/cancel — the guest for their own upcoming booking,
 * or the manager for any. The booking is kept with status "cancelled" rather
 * than deleted, so its receipt and history survive.
 */
bookingsRouter.patch('/:id/cancel', requireRole('guest', 'manager'), async (req, res) => {
  const booking = await findVisibleBooking(req)
  if (booking.status !== 'confirmed') {
    throw new HttpError(409, 'Only upcoming bookings that haven’t been checked in can be cancelled.')
  }

  booking.status = 'cancelled'
  await booking.save()
  res.json({ booking })
})
