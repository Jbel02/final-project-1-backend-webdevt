import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { errorHandler, notFound } from './middleware/errors.js'
import { authRouter } from './routes/auth.js'
import { bookingsRouter } from './routes/bookings.js'
import { roomsRouter } from './routes/rooms.js'
import { usersRouter } from './routes/users.js'

/**
 * The Express app, without a database connection or a listening port — so
 * the tests can drive it through Supertest against their own database.
 */
export function createApp() {
  const app = express()

  // Behind Render's proxy (and Vercel's rewrite in front of that), the real
  // client IP is in X-Forwarded-For; rate limiting needs it.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(helmet())
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => res.json({ ok: true }))
  app.use('/api/auth', authRouter)
  app.use('/api/rooms', roomsRouter)
  app.use('/api/bookings', bookingsRouter)
  app.use('/api/users', usersRouter)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
