import { createApp } from './app.js'
import { config } from './config.js'
import { connectDatabase, startMemoryDatabase } from './db.js'
import { seedDatabase } from './seed/seed.js'

async function main() {
  if (config.isProduction && (!process.env.JWT_SECRET || !config.mongoUri)) {
    throw new Error('JWT_SECRET and MONGODB_URI must be set in production.')
  }

  let uri = config.mongoUri
  if (!uri) {
    // No Atlas yet: run on an in-memory database and seed it, so the whole
    // app works straight after `npm install`. Data resets on every restart.
    console.log('No MONGODB_URI set — starting an in-memory MongoDB for development…')
    uri = (await startMemoryDatabase()).uri
  }

  await connectDatabase(uri)
  const seeded = await seedDatabase({ onlyIfEmpty: true })
  if (seeded) console.log(`Seeded ${seeded.rooms} rooms, ${seeded.users} users, ${seeded.bookings} bookings.`)

  createApp().listen(config.port, () => {
    console.log(`SuiteSpot API listening on http://localhost:${config.port}`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
