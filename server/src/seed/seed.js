import bcrypt from 'bcryptjs'
import { ROOM_TYPE_DEFAULTS, ROOMS_PER_FLOOR, TOTAL_FLOORS } from '../../../shared/constants.js'
import { addDays, nightsBetween, parseDateOnly, todayDateOnly } from '../../../shared/dates.js'
import { quoteBooking } from '../../../shared/pricing.js'
import { Booking } from '../models/Booking.js'
import { Room } from '../models/Room.js'
import { User } from '../models/User.js'

/* ===== Seed data =====
   80 rooms (8 floors × 10) plus demo accounts and a handful of bookings
   placed relative to *today*, so every screen has something to show: a guest
   checked in, one arriving today, one leaving today, past and future stays.

   Demo credentials are test values for this project only — they are listed
   in README.md. Set SEED_MANAGER_PASSWORD before seeding a deployed database
   so the public demo password isn't the real manager login. */

const photo = (id) => `https://images.unsplash.com/photo-${id}?w=1200&q=75&auto=format&fit=crop`

const PHOTOS = {
  Single: ['1631049307264-da0ec9d70304', '1566665797739-1674de7a421a', '1582719478250-c89cae4dc85b'],
  Double: ['1595576508898-0ad5c879a061', '1618773928121-c32242e63f39'],
  King: ['1611892440504-42a792e24d32', '1591088398332-8a7791972843', '1590490360182-c33d57733427'],
  Suite: ['1578683010236-d716f9a3f461', '1560448204-e02f11c3d0e2'],
}

/** Positions 1–4 Single, 5–7 Double, 8–9 King, 10 Suite on every floor. */
function typeForPosition(position) {
  if (position <= 4) return 'Single'
  if (position <= 7) return 'Double'
  if (position <= 9) return 'King'
  return 'Suite'
}

/** Rooms out of service in the demo, so the Maintenance status is visible. */
const MAINTENANCE_ROOMS = new Set(['207', '609'])

export function buildRooms() {
  const rooms = []
  for (let floor = 1; floor <= TOTAL_FLOORS; floor += 1) {
    for (let position = 1; position <= ROOMS_PER_FLOOR; position += 1) {
      const roomNumber = `${floor}${String(position).padStart(2, '0')}`
      const type = typeForPosition(position)
      const photos = PHOTOS[type]
      rooms.push({
        roomNumber,
        floor,
        type,
        ...ROOM_TYPE_DEFAULTS[type],
        photoUrl: photo(photos[(floor + position) % photos.length]),
        status: MAINTENANCE_ROOMS.has(roomNumber) ? 'maintenance' : 'available',
      })
    }
  }
  return rooms
}

export const DEMO_ACCOUNTS = [
  { key: 'manager', name: 'Hotel Manager', email: 'manager@suitespot.test', role: 'manager', password: 'Manager123', contact: '+63 917 000 0001' },
  { key: 'desk', name: 'Front Desk', email: 'frontdesk@suitespot.test', role: 'receptionist', password: 'Desk12345', contact: '+63 917 000 0002' },
  { key: 'juan', name: 'Juan Dela Cruz', email: 'guest@suitespot.test', role: 'guest', password: 'Guest1234', contact: '+63 917 123 4567', address: 'Quezon City, Metro Manila' },
  { key: 'maria', name: 'Maria Santos', email: 'maria@suitespot.test', role: 'guest', password: 'Guest1234', contact: '+63 918 765 4321', address: 'Makati City, Metro Manila' },
  { key: 'ana', name: 'Ana Reyes', email: 'ana@suitespot.test', role: 'guest', password: 'Guest1234', contact: '+63 919 222 3344', address: 'Cebu City, Cebu' },
  { key: 'carlo', name: 'Carlo Mendoza', email: 'carlo@suitespot.test', role: 'guest', password: 'Guest1234', contact: '+63 920 555 6677', address: 'Davao City, Davao del Sur' },
]

/** [guest, room, check-in offset, nights, guests, meals, payment, status] */
const DEMO_BOOKINGS = [
  ['juan', '305', -10, 3, 2, 'dinner', 'full', 'completed'],
  ['juan', '102', -1, 3, 1, 'none', 'partial', 'checked-in'],
  ['juan', '810', 14, 3, 3, 'both', 'partial', 'confirmed'],
  ['maria', '506', 0, 3, 2, 'lunch', 'full', 'confirmed'],
  ['maria', '709', -20, 2, 2, 'none', 'full', 'cancelled'],
  ['ana', '410', -3, 3, 4, 'both', 'partial', 'checked-in'],
  ['ana', '201', 5, 1, 1, 'none', 'full', 'confirmed'],
  ['carlo', '608', -30, 3, 2, 'dinner', 'partial', 'completed'],
  ['carlo', '505', 2, 2, 2, 'none', 'partial', 'confirmed'],
]

/**
 * @param {{onlyIfEmpty?: boolean}} options  onlyIfEmpty skips seeding when
 *   rooms already exist — used on every server start. Without it, existing
 *   data is wiped first (the `npm run seed` script asks before doing that).
 * @returns {Promise<null | {rooms: number, users: number, bookings: number}>}
 */
export async function seedDatabase({ onlyIfEmpty = false } = {}) {
  if (onlyIfEmpty && (await Room.estimatedDocumentCount()) > 0) return null

  await Promise.all([Booking.deleteMany({}), Room.deleteMany({}), User.deleteMany({})])

  const rooms = await Room.insertMany(buildRooms())
  const roomByNumber = new Map(rooms.map((room) => [room.roomNumber, room]))

  const users = await User.insertMany(
    await Promise.all(
      DEMO_ACCOUNTS.map(async ({ key, password, ...account }) => {
        const secret =
          key === 'manager' && process.env.SEED_MANAGER_PASSWORD
            ? process.env.SEED_MANAGER_PASSWORD
            : password
        return { ...account, passwordHash: await bcrypt.hash(secret, 10) }
      }),
    ),
  )
  const userByKey = new Map(DEMO_ACCOUNTS.map((account, index) => [account.key, users[index]]))

  const today = todayDateOnly()
  const bookings = DEMO_BOOKINGS.map(
    ([guestKey, roomNumber, offset, nights, guests, mealAddons, paymentStatus, status]) => {
      const guest = userByKey.get(guestKey)
      const room = roomByNumber.get(roomNumber)
      const checkIn = addDays(today, offset)
      const checkOut = addDays(checkIn, nights)
      const quote = quoteBooking({
        pricePerNight: room.pricePerNight,
        nights: nightsBetween(checkIn, checkOut),
        guests,
        mealAddons,
        paymentStatus,
      })
      // A completed stay settled its balance at check-out.
      const settled = status === 'completed'

      return {
        guest: guest._id,
        room: room._id,
        checkIn: parseDateOnly(checkIn),
        checkOut: parseDateOnly(checkOut),
        guests,
        mealAddons,
        totalAmount: quote.totalAmount,
        paidAmount: settled ? quote.totalAmount : quote.paidAmount,
        balance: settled ? 0 : quote.balance,
        paymentStatus: settled ? 'full' : paymentStatus,
        status,
        roomSnapshot: {
          roomNumber: room.roomNumber,
          type: room.type,
          floor: room.floor,
          pricePerNight: room.pricePerNight,
        },
        guestSnapshot: { name: guest.name, email: guest.email },
      }
    },
  )
  // create (not insertMany) so each booking gets its generated transactionId.
  await Booking.create(bookings)

  return { rooms: rooms.length, users: users.length, bookings: bookings.length }
}
