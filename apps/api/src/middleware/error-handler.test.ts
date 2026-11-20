import express from 'express'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { EmailTakenError, NotFoundError } from '../errors/domain-errors'
import { errorHandler } from './error-handler'

function appThatThrows(error: () => never) {
  const app = express()
  app.get('/boom', () => {
    error()
  })
  app.use(errorHandler)
  return app
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('error handler', () => {
  it('turns invalid input into 400 with one detail per field', async () => {
    const schema = z.object({ email: z.email({ error: 'Enter a valid email' }) })
    const app = appThatThrows(() => {
      schema.parse({ email: 'nope' })
      throw new Error('unreachable')
    })
    const response = await request(app).get('/boom')
    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        details: [{ path: 'email', message: 'Enter a valid email' }],
      },
    })
  })

  it('turns a missing record into 404', async () => {
    const app = appThatThrows(() => {
      throw new NotFoundError('Employee')
    })
    const response = await request(app).get('/boom')
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Employee not found' } })
  })

  it('turns a used email into 409 and points at the email field', async () => {
    const app = appThatThrows(() => {
      throw new EmailTakenError()
    })
    const response = await request(app).get('/boom')
    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      error: {
        code: 'EMAIL_TAKEN',
        message: 'This email is already used by another employee',
        details: [{ path: 'email', message: 'This email is already used by another employee' }],
      },
    })
  })

  it('hides the details of an unexpected error from the client', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const app = appThatThrows(() => {
      throw new Error('password authentication failed for user "postgres"')
    })
    const response = await request(app).get('/boom')
    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    })
  })

  it('logs an unexpected error once', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const app = appThatThrows(() => {
      throw new Error('disk full')
    })
    await request(app).get('/boom')
    expect(log).toHaveBeenCalledTimes(1)
  })
})
