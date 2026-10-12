import mongoose from 'mongoose'
import { hasErrors } from '../../../shared/validation.js'

/** An error that already knows its HTTP status and user-facing message. */
export class HttpError extends Error {
  constructor(status, message, fieldErrors) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/** Throws a 400 carrying per-field messages when a validator found problems. */
export function assertValid(errors) {
  if (hasErrors(errors)) {
    throw new HttpError(400, 'Check the highlighted fields and try again.', errors)
  }
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'That page doesn’t exist.'))
}

// Express recognises an error handler by its four parameters.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, errors: err.fieldErrors })
  }

  // Duplicate key — the unique index caught a race the pre-check didn't.
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0]
    const messages = {
      email: { email: 'An account with this email already exists.' },
      roomNumber: { roomNumber: 'A room with this number already exists.' },
    }
    return res.status(409).json({
      message: 'That already exists.',
      errors: messages[field],
    })
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json({ message: 'We couldn’t find that.' })
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(
      Object.entries(err.errors).map(([field, detail]) => [field, detail.message]),
    )
    return res.status(400).json({ message: 'Check the highlighted fields and try again.', errors })
  }

  // Malformed JSON body.
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request couldn’t be read.' })
  }

  console.error(err)
  return res.status(500).json({ message: 'Something went wrong. Try again in a moment.' })
}
