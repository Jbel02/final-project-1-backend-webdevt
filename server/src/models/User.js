import mongoose from 'mongoose'
import { ROLES } from '../../../shared/constants.js'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // select: false — the hash never leaves the database unless a query asks
    // for it by name (only login does).
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'guest' },
    contact: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id
    delete ret.__v
    delete ret.passwordHash
    return ret
  },
})

export const User = mongoose.model('User', userSchema)
