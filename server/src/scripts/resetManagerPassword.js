import readline from 'node:readline/promises'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { config } from '../config.js'
import { connectDatabase } from '../db.js'
import { User } from '../models/User.js'
import { DEMO_ACCOUNTS } from '../seed/seed.js'

/**
 * `npm run reset-manager-password [-- <new password>]` — sets the demo
 * Manager's password in the database in MONGODB_URI and touches nothing else
 * (unlike `npm run seed`, which wipes everything). With no argument it restores
 * the password published in the README.
 *
 * Needed because SEED_MANAGER_PASSWORD only applies while the database is
 * empty: once Atlas has been seeded, changing it on Render does nothing.
 */
const manager = DEMO_ACCOUNTS.find((account) => account.key === 'manager')

async function main() {
  if (!config.mongoUri) {
    console.log('MONGODB_URI is not set. Add it to server/.env first (see .env.example).')
    process.exit(1)
  }

  const args = process.argv.slice(2).filter((arg) => arg !== '--yes')
  const password = args[0] ?? manager.password
  if (password.length < 8) {
    console.log('The password must be at least 8 characters. Nothing was changed.')
    process.exit(1)
  }

  await connectDatabase(config.mongoUri)
  const database = mongoose.connection.name

  if (!process.argv.includes('--yes')) {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await prompt.question(
      `Set the password of ${manager.email} in the "${database}" database? (y/N) `,
    )
    prompt.close()
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('Cancelled. Nothing was changed.')
      await mongoose.disconnect()
      process.exit(0)
    }
  }

  const result = await User.updateOne(
    { email: manager.email, role: 'manager' },
    { passwordHash: await bcrypt.hash(password, 10) },
  )
  console.log(
    result.matchedCount
      ? `Updated ${manager.email} in "${database}".`
      : `No manager with the email ${manager.email} in "${database}". Nothing was changed.`,
  )
  await mongoose.disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
