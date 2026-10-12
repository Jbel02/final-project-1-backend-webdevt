import readline from 'node:readline/promises'
import mongoose from 'mongoose'
import { config } from '../config.js'
import { connectDatabase } from '../db.js'
import { seedDatabase } from '../seed/seed.js'

/**
 * `npm run seed` — resets the database in MONGODB_URI to the demo data.
 * Destructive, so it asks first (pass --yes to skip the prompt).
 *
 * Not needed for local development without Atlas: the in-memory database is
 * seeded automatically on every start.
 */
async function main() {
  if (!config.mongoUri) {
    console.log('MONGODB_URI is not set. Add it to server/.env first (see .env.example).')
    process.exit(1)
  }

  if (!process.argv.includes('--yes')) {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await prompt.question(
      'This deletes every room, user and booking in MONGODB_URI and loads demo data. Continue? (y/N) ',
    )
    prompt.close()
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('Cancelled. Nothing was changed.')
      process.exit(0)
    }
  }

  await connectDatabase(config.mongoUri)
  const result = await seedDatabase()
  console.log(`Seeded ${result.rooms} rooms, ${result.users} users, ${result.bookings} bookings.`)
  await mongoose.disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
