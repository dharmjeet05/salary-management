import { createTestDb, type TestDb } from '@salary/db/testing'
import type { Express } from 'express'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp } from './app'

const webOrigin = 'http://localhost:3000'
let testDb: TestDb
let app: Express

beforeAll(async () => {
  testDb = await createTestDb()
  app = createApp({ corsOrigin: webOrigin, db: testDb.db })
})

afterAll(async () => {
  await testDb.close()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('api app', () => {
  it('answers the health check', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok' })
  })

  it('answers an unknown route with 404 and the error body', async () => {
    const response = await request(app).get('/nope')
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
  })

  it('answers a body that is not valid JSON with 400', async () => {
    const response = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{"fullName":')
    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' },
    })
  })

  it('answers a body over 100 kb with 413', async () => {
    const response = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ note: 'x'.repeat(200_000) }))
    expect(response.status).toBe(413)
    expect(response.body).toEqual({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
    })
  })

  it('does not log a body that is too large as a crash', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ note: 'x'.repeat(200_000) }))
    expect(log).not.toHaveBeenCalled()
  })

  it('answers a body in a charset it cannot read with 400', async () => {
    const response = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json; charset=klingon')
      .send('{}')
    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Request body could not be read' },
    })
  })

  it('lets the web app call it from its origin', async () => {
    const response = await request(app).get('/health').set('Origin', webOrigin)
    expect(response.headers['access-control-allow-origin']).toBe(webOrigin)
  })

  it('does not let another site call it from the browser', async () => {
    const response = await request(app).get('/health').set('Origin', 'https://evil.example')
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('does not tell clients it runs on Express', async () => {
    const response = await request(app).get('/health')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })
})
