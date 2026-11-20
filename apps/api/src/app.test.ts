import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app'

const webOrigin = 'http://localhost:3000'
const app = createApp({ corsOrigin: webOrigin })

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
