import readline from 'node:readline/promises'
import mongoose from 'mongoose'
import { config } from '../config.js'
import { connectDatabase } from '../db.js'
import { ResetError, findManager, resetManagerPassword } from '../services/resetManagerPassword.js'

/**
 * `npm run reset-manager-password` — sets a new password on the existing
 * manager account in the database named by MONGODB_URI. Touches that one
 * account's password hash and nothing else: no rooms, bookings or other users
 * are read, changed or deleted, and nothing is created.
 *
 *   MONGODB_URI            required. The Atlas string — the same one Render uses.
 *   MANAGER_EMAIL          optional. Defaults to manager@suitespot.test.
 *   MANAGER_NEW_PASSWORD   optional. If unset, you are asked for it with hidden input.
 *
 * Flags:  --dry-run  look up the account and stop;   --yes  skip the confirmation.
 *
 * The password and the connection string are never printed. Only the host and
 * database name are shown, so you can check you are pointed at production.
 */

const DEFAULT_EMAIL = 'manager@suitespot.test'

/** Host and database name of a MongoDB URI — never the credentials. */
function describeTarget(uri) {
  try {
    const url = new URL(uri)
    return { host: url.hostname, database: decodeURIComponent(url.pathname.replace(/^\//, '')) || mongoose.connection.name }
  } catch {
    return { host: '(unreadable)', database: mongoose.connection.name }
  }
}

/** Reads a line from the terminal without echoing it. */
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new ResetError('No terminal to type the password into. Set MANAGER_NEW_PASSWORD for this one run instead.'))
      return
    }
    let value = ''
    const finish = (result) => {
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdin.off('data', onData)
      process.stdout.write('\n')
      resolve(result)
    }
    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === '\r' || character === '\n' || character === '\u0004') return finish(value)
        if (character === '\u0003') {
          process.stdin.setRawMode(false)
          process.stdout.write('\nCancelled. Nothing was changed.\n')
          process.exit(130)
        }
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1)
        else value += character
      }
    }
    // Echo is switched off *before* the prompt is shown. Doing it the other way
    // round leaves a gap in which fast typing or a paste is printed in the clear.
    process.stdin.setRawMode(true)
    process.stdin.setEncoding('utf8')
    process.stdin.resume()
    process.stdin.on('data', onData)
    process.stdout.write(question)
  })
}

async function readNewPassword() {
  if (process.env.MANAGER_NEW_PASSWORD) return process.env.MANAGER_NEW_PASSWORD
  const first = await promptHidden('New manager password: ')
  const second = await promptHidden('Type it again to confirm: ')
  if (first !== second) throw new ResetError('The two entries did not match. Nothing was changed.')
  return first
}

async function main() {
  if (!config.mongoUri) {
    throw new ResetError('MONGODB_URI is not set. Set it to the production Atlas connection string for this run (see the README).')
  }
  const email = process.env.MANAGER_EMAIL || DEFAULT_EMAIL
  const dryRun = process.argv.includes('--dry-run')

  await connectDatabase(config.mongoUri)
  const { host, database } = describeTarget(config.mongoUri)
  console.log(`Database: ${database} on ${host}`)

  const manager = await findManager(email)
  if (!manager) throw new ResetError(`No manager account with the email ${email} exists in this database. Nothing was changed.`)
  console.log(`Found manager: ${manager.name} <${manager.email}>${manager.isActive ? '' : '  (deactivated — sign-in will still be refused)'}`)

  if (dryRun) {
    console.log('Dry run: nothing was changed.')
    return
  }

  const password = await readNewPassword()

  if (!process.argv.includes('--yes')) {
    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout })
    const answer = await prompt.question(`Replace the password for ${manager.email} in "${database}" on ${host}? (y/N) `)
    prompt.close()
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('Cancelled. Nothing was changed.')
      return
    }
  }

  await resetManagerPassword({ email, password })
  console.log(`Done. The password for ${manager.email} was replaced and verified. No other record was changed.`)
}

main()
  .catch((error) => {
    // Our own errors are written to be read; anything else is printed without
    // the stack so a connection error can't spill the connection string.
    console.error(error instanceof ResetError ? error.message : `Failed: ${error.message}`)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
