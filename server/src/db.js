import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'

/**
 * Connects Mongoose. Bookings are written inside a transaction (see
 * routes/bookings.js), and MongoDB only supports transactions on a replica
 * set — Atlas always is one, and the local in-memory database is started as
 * one for the same reason.
 */
export async function connectDatabase(uri) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  return mongoose.connection
}

/**
 * Where the MongoDB binary for the in-memory database is cached. Pinned to
 * server/node_modules so `npm run dev` (started from the repo root) and
 * `npm test` share one ~600 MB download instead of each fetching their own.
 */
export const MEMORY_DB_BINARY_DIR = fileURLToPath(
  new URL('../node_modules/.cache/mongodb-memory-server', import.meta.url),
)

/** Local development without Atlas: a throwaway single-node replica set. */
export async function startMemoryDatabase() {
  const { MongoMemoryReplSet } = await import('mongodb-memory-server')
  const replSet = await MongoMemoryReplSet.create({
    binary: { downloadDir: MEMORY_DB_BINARY_DIR },
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  })
  return { uri: replSet.getUri('suitespot'), stop: () => replSet.stop() }
}
