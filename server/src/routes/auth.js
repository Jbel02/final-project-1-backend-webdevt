import bcrypt from 'bcryptjs'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { config } from '../config.js'
import { authenticate, clearAuthCookie, setAuthCookie } from '../middleware/auth.js'
import { HttpError, assertValid } from '../middleware/errors.js'
import { User } from '../models/User.js'
import { validateLogin, validateRegistration } from '../../../shared/validation.js'

export const authRouter = Router()

// ➕ Slows password guessing. Generous on purpose: behind Vercel's rewrite,
// requests can arrive from a shared proxy address, and a whole class trying
// the demo at once must not lock each other out.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 1000 : 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Wait a few minutes and try again.' },
})

export const BCRYPT_ROUNDS = 10

export const pickProfile = (body) => ({
  name: body.name?.trim(),
  email: body.email?.trim().toLowerCase(),
  contact: body.contact?.trim() ?? '',
  address: body.address?.trim() ?? '',
})

/** POST /api/auth/register — public. Self-registration is guests only. */
authRouter.post('/register', credentialLimiter, async (req, res) => {
  assertValid(validateRegistration(req.body))
  const profile = pickProfile(req.body)

  if (await User.exists({ email: profile.email })) {
    throw new HttpError(409, 'That email is already registered.', {
      email: 'An account with this email already exists.',
    })
  }

  const user = await User.create({
    ...profile,
    // Role is fixed here, never read from the body — otherwise anyone could
    // register themselves as a manager.
    role: 'guest',
    passwordHash: await bcrypt.hash(req.body.password, BCRYPT_ROUNDS),
  })

  setAuthCookie(res, user)
  res.status(201).json({ user })
})

/** POST /api/auth/login — public. */
authRouter.post('/login', credentialLimiter, async (req, res) => {
  assertValid(validateLogin(req.body))

  const user = await User.findOne({ email: req.body.email.trim().toLowerCase() }).select(
    '+passwordHash',
  )
  const matches = user && (await bcrypt.compare(req.body.password, user.passwordHash))

  // One message for both "no such email" and "wrong password", so the form
  // can't be used to find out who has an account.
  if (!matches) throw new HttpError(401, 'Incorrect email or password.')
  if (!user.isActive) {
    throw new HttpError(403, 'This account has been deactivated. Contact the hotel for help.')
  }

  setAuthCookie(res, user)
  res.json({ user })
})

/** POST /api/auth/logout — authenticated. */
authRouter.post('/logout', authenticate, (_req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

/** GET /api/auth/me — authenticated. */
authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user })
})
