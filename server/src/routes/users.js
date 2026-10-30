import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { ACTIVE_BOOKING_STATUSES, ROLES, compareByRole } from '../../../shared/constants.js'
import { validateProfile, validateStaffAccount } from '../../../shared/validation.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { HttpError, assertValid } from '../middleware/errors.js'
import { Booking } from '../models/Booking.js'
import { User } from '../models/User.js'
import { BCRYPT_ROUNDS, pickProfile } from './auth.js'

export const usersRouter = Router()

usersRouter.use(authenticate)

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

async function assertEmailFree(email, exceptId) {
  const clash = await User.exists({ email, ...(exceptId && { _id: { $ne: exceptId } }) })
  if (clash) {
    throw new HttpError(409, 'That email is already registered.', {
      email: 'An account with this email already exists.',
    })
  }
}

/**
 * Loads a user the manager is about to change. Managers can't act on
 * themselves or on other managers — that is the one way to lock everyone out
 * of administration.
 */
async function findManageableUser(req, verb) {
  const user = await User.findById(req.params.id)
  if (!user) throw new HttpError(404, 'We couldn’t find that account.')
  if (user._id.equals(req.user._id)) throw new HttpError(409, `You can’t ${verb} your own account.`)
  if (user.role === 'manager') throw new HttpError(409, `Manager accounts can’t be ${verb}d here.`)
  return user
}

/** ➕ PATCH /api/users/me — any signed-in user edits their own profile. */
usersRouter.patch('/me', async (req, res) => {
  assertValid(validateProfile(req.body))
  const profile = pickProfile(req.body)
  await assertEmailFree(profile.email, req.user._id)

  Object.assign(req.user, profile)
  await req.user.save()
  res.json({ user: req.user })
})

// Everything below is manager-only.
usersRouter.use(requireRole('manager'))

/** GET /api/users — manager. Optional ?role= and ?q= (name or email). */
usersRouter.get('/', async (req, res) => {
  const filter = {}
  if (ROLES.includes(req.query.role)) filter.role = req.query.role
  if (typeof req.query.q === 'string' && req.query.q.trim()) {
    const pattern = new RegExp(escapeRegex(req.query.q.trim()), 'i')
    filter.$or = [{ name: pattern }, { email: pattern }]
  }

  // Newest first within a role; the role order itself (manager, receptionist,
  // guest) is applied on top, so the manager is always at the head of the staff.
  const users = (await User.find(filter).sort({ createdAt: -1 })).sort(compareByRole)
  res.json({ users })
})

/** ➕ GET /api/users/:id — manager. Account detail screen. */
usersRouter.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) throw new HttpError(404, 'We couldn’t find that account.')
  const bookingCount = await Booking.countDocuments({ guest: user._id })
  res.json({ user, bookingCount })
})

/** POST /api/users/receptionist — manager. Staff are never self-registered. */
usersRouter.post('/receptionist', async (req, res) => {
  assertValid(validateStaffAccount(req.body))
  const profile = pickProfile(req.body)
  await assertEmailFree(profile.email)

  const user = await User.create({
    ...profile,
    role: 'receptionist',
    passwordHash: await bcrypt.hash(req.body.password, BCRYPT_ROUNDS),
  })
  res.status(201).json({ user })
})

/** PATCH /api/users/:id/deactivate — manager. Blocks sign-in immediately. */
usersRouter.patch('/:id/deactivate', async (req, res) => {
  const user = await findManageableUser(req, 'deactivate')
  user.isActive = false
  await user.save()
  res.json({ user })
})

/** ➕ PATCH /api/users/:id/activate — manager. Undoes a deactivation. */
usersRouter.patch('/:id/activate', async (req, res) => {
  const user = await findManageableUser(req, 'reactivate')
  user.isActive = true
  await user.save()
  res.json({ user })
})

/**
 * DELETE /api/users/:id — manager. Refused while the guest still has an
 * upcoming or current stay. Past bookings are kept; their receipts show the
 * name captured at booking time.
 */
usersRouter.delete('/:id', async (req, res) => {
  const user = await findManageableUser(req, 'delete')

  const hasActiveStay = await Booking.exists({
    guest: user._id,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  })
  if (hasActiveStay) {
    throw new HttpError(
      409,
      `${user.name} has an upcoming or current stay. Cancel or complete it before deleting this account, or deactivate the account instead.`,
    )
  }

  await user.deleteOne()
  res.status(204).end()
})
