import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { User } from '../models/User.js'
import { HttpError } from './errors.js'

/* ===== Authentication =====
   The JWT lives in an httpOnly cookie, so page scripts can't read it (an XSS
   bug can't steal it). The client never handles the token at all — the
   browser attaches it to every /api request on its own. */

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })
}

export function setAuthCookie(res, user) {
  res.cookie(config.cookieName, signToken(user), {
    httpOnly: true,
    // Same-origin in every environment (Vite proxy locally, Vercel rewrite in
    // production), so Lax is enough and third-party-cookie blocking in
    // Safari never applies.
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: config.cookieMaxAgeMs,
    path: '/',
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
  })
}

/**
 * Resolves the cookie to a user, re-reading the account on every request so
 * a deactivation or deletion takes effect immediately rather than when the
 * token expires a week later.
 */
async function resolveUser(req) {
  const token = req.cookies?.[config.cookieName]
  if (!token) return null

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    const user = await User.findById(payload.sub)
    return user?.isActive ? user : null
  } catch {
    return null
  }
}

/** Requires a signed-in, active account. */
export async function authenticate(req, res, next) {
  const user = await resolveUser(req)
  if (!user) {
    clearAuthCookie(res)
    throw new HttpError(401, 'Sign in to continue.')
  }
  req.user = user
  next()
}

/** Attaches the user if there is one; public routes stay public. */
export async function optionalAuth(req, _res, next) {
  req.user = await resolveUser(req)
  next()
}

/** Role gate. Always placed after `authenticate`. */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new HttpError(403, 'Your account doesn’t have access to this.')
    }
    next()
  }
}
