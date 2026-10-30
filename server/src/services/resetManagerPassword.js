import bcrypt from 'bcryptjs'
import { validateNewPassword } from '../../../shared/validation.js'
import { User } from '../models/User.js'
import { BCRYPT_ROUNDS } from '../routes/auth.js'

/**
 * Resetting a manager's password, and nothing else.
 *
 * Why this exists: the manager's password is only ever written by the seed
 * (seed/seed.js), and the seed runs only against an *empty* database
 * (`seedDatabase({ onlyIfEmpty: true })` in index.js). Once a deployed database
 * has been seeded, changing SEED_MANAGER_PASSWORD changes nothing, and the
 * seed must not be re-run to "fix" it — that deletes every room, booking and
 * user. This updates one field on one existing account instead.
 *
 * The password is never logged, returned or stored anywhere but as a bcrypt
 * hash, hashed with the same cost as sign-up and the seed (BCRYPT_ROUNDS).
 */

export class ResetError extends Error {}

const normalise = (email) => String(email ?? '').trim().toLowerCase()

/**
 * The manager account that would be reset, or null. Matches on role as well as
 * email, so this can never be pointed at a guest or receptionist.
 * @returns {Promise<null | {id: string, name: string, email: string, isActive: boolean}>}
 */
export async function findManager(email) {
  const user = await User.findOne({ email: normalise(email), role: 'manager' })
  return user ? { id: String(user._id), name: user.name, email: user.email, isActive: user.isActive } : null
}

/**
 * @param {{ email: string, password: string }} input
 * @returns {Promise<{ email: string, name: string, verified: true }>} never the password or hash
 * @throws {ResetError} no such manager, password too weak, or the write did not take
 */
export async function resetManagerPassword({ email, password }) {
  const problem = Object.values(validateNewPassword(password))[0]
  if (problem) throw new ResetError(`That password isn't allowed. ${problem}`)

  const manager = await findManager(email)
  if (!manager) throw new ResetError(`No manager account with the email ${normalise(email)} was found. Nothing was changed.`)

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  // One document, matched by id *and* role; only passwordHash is set.
  const result = await User.updateOne({ _id: manager.id, role: 'manager' }, { $set: { passwordHash } })
  if (result.matchedCount !== 1) throw new ResetError('The account changed while resetting. Nothing was changed; try again.')

  // Read it back and check the stored hash really matches, so "success" means sign-in will work.
  const stored = await User.findById(manager.id).select('+passwordHash')
  if (!stored || !(await bcrypt.compare(password, stored.passwordHash))) {
    throw new ResetError('The new password could not be verified after saving. Run the reset again.')
  }

  return { email: manager.email, name: manager.name, verified: true }
}
