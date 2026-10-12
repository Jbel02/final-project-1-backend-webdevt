import { MongoMemoryReplSet } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { MEMORY_DB_BINARY_DIR } from '../src/db.js'
import { seedDatabase } from '../src/seed/seed.js'

export const app = createApp()

let replSet

/** Fresh replica set per test file — transactions need one. */
export async function startDatabase() {
  replSet = await MongoMemoryReplSet.create({
    binary: { downloadDir: MEMORY_DB_BINARY_DIR },
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  })
  await mongoose.connect(replSet.getUri('suitespot-test'))
}

export async function stopDatabase() {
  await mongoose.disconnect()
  await replSet?.stop()
}

export const resetDemoData = () => seedDatabase()

export const ACCOUNTS = {
  manager: { email: 'manager@suitespot.test', password: 'Manager123' },
  receptionist: { email: 'frontdesk@suitespot.test', password: 'Desk12345' },
  guest: { email: 'guest@suitespot.test', password: 'Guest1234' },
  otherGuest: { email: 'maria@suitespot.test', password: 'Guest1234' },
}

/** A Supertest agent that keeps the auth cookie between requests. */
export async function signIn(who) {
  const agent = request.agent(app)
  await agent.post('/api/auth/login').send(ACCOUNTS[who]).expect(200)
  return agent
}

export const anonymous = () => request(app)

export async function roomByNumber(roomNumber) {
  const { Room } = await import('../src/models/Room.js')
  return Room.findOne({ roomNumber })
}
