import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

describe('the API root', () => {
  it('answers with a short status instead of an error, for anyone opening the backend link', async () => {
    const { status, body } = await request(createApp()).get('/')
    expect(status).toBe(200)
    expect(body).toEqual({ name: 'SuiteSpot API', status: 'ok', health: '/api/health' })
  })

  it('still reports unknown paths as not found', async () => {
    const { status } = await request(createApp()).get('/nothing-here')
    expect(status).toBe(404)
  })
})
