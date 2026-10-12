import mongoose from 'mongoose'
import { ROOM_STATUSES, ROOM_TYPES, TOTAL_FLOORS } from '../../../shared/constants.js'

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true, trim: true },
    floor: { type: Number, required: true, min: 1, max: TOTAL_FLOORS },
    type: { type: String, required: true, enum: ROOM_TYPES },
    pricePerNight: { type: Number, required: true, min: 0 },
    maxOccupancy: { type: Number, required: true, min: 1 },
    photoUrl: { type: String, trim: true, default: '' },
    status: { type: String, enum: ROOM_STATUSES, default: 'available' },
  },
  { timestamps: true },
)

roomSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.__v
    return ret
  },
})

export const Room = mongoose.model('Room', roomSchema)
