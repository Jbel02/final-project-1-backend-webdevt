import { Router } from 'express'
import { ACTIVE_BOOKING_STATUSES, ROOM_STATUSES, ROOM_TYPES } from '../../../shared/constants.js'
import { parseDateOnly, todayDateOnly } from '../../../shared/dates.js'
import { validateRoom, validateStayDates } from '../../../shared/validation.js'
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js'
import { HttpError, assertValid } from '../middleware/errors.js'
import { Booking } from '../models/Booking.js'
import { Room } from '../models/Room.js'
import { bookedRoomIds, isRoomBooked } from '../services/availability.js'

export const roomsRouter = Router()

// Room numbers sort as numbers ("1010" after "810"), not as strings.
const NUMERIC = { locale: 'en', numericOrdering: true }

const pickRoom = (body) => ({
  roomNumber: String(body.roomNumber).trim(),
  floor: Number(body.floor),
  type: body.type,
  pricePerNight: Number(body.pricePerNight),
  maxOccupancy: Number(body.maxOccupancy),
  photoUrl: body.photoUrl?.trim() ?? '',
  status: body.status,
})

/** Optional ?checkIn&checkOut pair: both or neither, and a valid stay. */
function readStay(query) {
  const { checkIn, checkOut } = query
  if (!checkIn && !checkOut) return null
  assertValid(validateStayDates({ checkIn, checkOut }, { today: todayDateOnly() }))
  return { checkIn, checkOut }
}

function readPrice(value, field) {
  if (value === undefined || value === '') return undefined
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) {
    throw new HttpError(400, 'Enter a valid price.', { [field]: 'Enter a valid price.' })
  }
  return number
}

/**
 * GET /api/rooms — public. Filters: checkIn + checkOut (date range), minPrice,
 * maxPrice, guests (capacity), type. Guests and visitors only ever see rooms
 * that can be booked; the manager sees all 80, including maintenance, and can
 * filter by status.
 */
roomsRouter.get('/', optionalAuth, async (req, res) => {
  const isManager = req.user?.role === 'manager'
  const stay = readStay(req.query)
  const minPrice = readPrice(req.query.minPrice, 'minPrice')
  const maxPrice = readPrice(req.query.maxPrice, 'maxPrice')
  const guests = Number(req.query.guests)

  const filter = {}
  if (!isManager) filter.status = 'available'
  else if (ROOM_STATUSES.includes(req.query.status)) filter.status = req.query.status

  if (ROOM_TYPES.includes(req.query.type)) filter.type = req.query.type
  if (Number.isInteger(guests) && guests > 0) filter.maxOccupancy = { $gte: guests }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.pricePerNight = {}
    if (minPrice !== undefined) filter.pricePerNight.$gte = minPrice
    if (maxPrice !== undefined) filter.pricePerNight.$lte = maxPrice
  }
  if (stay) filter._id = { $nin: await bookedRoomIds(stay.checkIn, stay.checkOut) }

  const rooms = await Room.find(filter).collation(NUMERIC).sort({ roomNumber: 1 })
  res.json({ rooms })
})

/**
 * GET /api/rooms/:id — public. With ?checkIn&checkOut it also says whether
 * the room is free for that stay, so the detail screen can show it before
 * the guest commits to booking.
 */
roomsRouter.get('/:id', optionalAuth, async (req, res) => {
  const room = await Room.findById(req.params.id)
  const isManager = req.user?.role === 'manager'
  if (!room || (room.status !== 'available' && !isManager)) {
    throw new HttpError(404, 'This room isn’t available right now.')
  }

  const stay = readStay(req.query)
  const availability = stay
    ? {
        ...stay,
        available:
          room.status === 'available' &&
          !(await isRoomBooked(room.id, stay.checkIn, stay.checkOut)),
      }
    : null

  res.json({ room, availability })
})

/** POST /api/rooms — manager. */
roomsRouter.post('/', authenticate, requireRole('manager'), async (req, res) => {
  assertValid(validateRoom(req.body))
  const values = pickRoom(req.body)

  if (await Room.exists({ roomNumber: values.roomNumber })) {
    throw new HttpError(409, 'That room number is taken.', {
      roomNumber: 'A room with this number already exists.',
    })
  }

  const room = await Room.create(values)
  res.status(201).json({ room })
})

/** PUT /api/rooms/:id — manager. Price, capacity, photo, status, etc. */
roomsRouter.put('/:id', authenticate, requireRole('manager'), async (req, res) => {
  assertValid(validateRoom(req.body))
  const values = pickRoom(req.body)

  const clash = await Room.exists({ roomNumber: values.roomNumber, _id: { $ne: req.params.id } })
  if (clash) {
    throw new HttpError(409, 'That room number is taken.', {
      roomNumber: 'A room with this number already exists.',
    })
  }

  const room = await Room.findByIdAndUpdate(req.params.id, values, {
    new: true,
    runValidators: true,
  })
  if (!room) throw new HttpError(404, 'We couldn’t find that room.')
  res.json({ room })
})

/**
 * DELETE /api/rooms/:id — manager. Refused while the room still has a guest
 * in it or a future stay booked: deleting it would strand those bookings.
 * Maintenance status is the way to take a room out of service.
 */
roomsRouter.delete('/:id', authenticate, requireRole('manager'), async (req, res) => {
  const room = await Room.findById(req.params.id)
  if (!room) throw new HttpError(404, 'We couldn’t find that room.')

  const hasActiveStay = await Booking.exists({
    room: room.id,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkOut: { $gte: parseDateOnly(todayDateOnly()) },
  })
  if (hasActiveStay) {
    throw new HttpError(
      409,
      `Room ${room.roomNumber} has upcoming or current stays. Set it to Maintenance instead, or cancel those bookings first.`,
    )
  }

  await room.deleteOne()
  res.status(204).end()
})
