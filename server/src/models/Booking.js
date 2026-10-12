import crypto from 'node:crypto'
import mongoose from 'mongoose'
import {
  BOOKING_STATUSES,
  MEAL_ADDONS,
  PAYMENT_STATUSES,
} from '../../../shared/constants.js'

/**
 * Readable, unguessable reference printed on the receipt, e.g.
 * SS-261012-7KQ4XM. The alphabet drops 0/O and 1/I so it can be read aloud
 * at the front desk without ambiguity.
 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateTransactionId(now = new Date()) {
  const stamp = now.toISOString().slice(2, 10).replaceAll('-', '')
  const bytes = crypto.randomBytes(6)
  const suffix = Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
  return `SS-${stamp}-${suffix}`
}

const bookingSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: () => generateTransactionId(),
    },
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    mealAddons: { type: String, enum: MEAL_ADDONS, default: 'none' },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: 'confirmed' },

    // ➕ Snapshots taken at booking time (an addition to the proposal's
    // schema). A receipt must keep showing what was actually booked and
    // charged even after the manager edits the room's price, or deletes the
    // room or the guest's account.
    roomSnapshot: {
      roomNumber: String,
      type: { type: String },
      floor: Number,
      pricePerNight: Number,
    },
    guestSnapshot: {
      name: String,
      email: String,
    },
  },
  { timestamps: true },
)

// Availability is "any active booking for this room overlapping these dates".
bookingSchema.index({ room: 1, status: 1, checkIn: 1, checkOut: 1 })
bookingSchema.index({ guest: 1, checkIn: -1 })

bookingSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.__v
    return ret
  },
})

export const Booking = mongoose.model('Booking', bookingSchema)
