import { describe, expect, it } from 'vitest'
import { loadEnv } from './env'

const databaseUrl = 'postgres://postgres:postgres@localhost:5432/salary_management'
const valid = { PORT: '4100', CORS_ORIGIN: 'http://localhost:3000', DATABASE_URL: databaseUrl }

describe('environment', () => {
  it('reads the port as a number', () => {
    expect(loadEnv(valid).port).toBe(4100)
  })

  it('uses port 4000 when PORT is not set', () => {
    expect(loadEnv({ CORS_ORIGIN: valid.CORS_ORIGIN, DATABASE_URL: databaseUrl }).port).toBe(4000)
  })

  it('reads the allowed web origin', () => {
    expect(loadEnv(valid).corsOrigin).toBe('http://localhost:3000')
  })

  it('stops when PORT is not a number', () => {
    expect(() => loadEnv({ ...valid, PORT: 'abc' })).toThrow(/PORT/)
  })

  it('stops when CORS_ORIGIN is missing', () => {
    expect(() => loadEnv({ PORT: valid.PORT })).toThrow(/CORS_ORIGIN/)
  })

  it('drops a trailing slash from CORS_ORIGIN, since browsers send the origin without one', () => {
    expect(loadEnv({ ...valid, CORS_ORIGIN: 'https://salary.vercel.app/' }).corsOrigin).toBe(
      'https://salary.vercel.app',
    )
  })

  it('stops when CORS_ORIGIN is not http or https', () => {
    expect(() => loadEnv({ ...valid, CORS_ORIGIN: 'javascript:alert(1)' })).toThrow(/CORS_ORIGIN/)
  })

  it('stops when CORS_ORIGIN is not a url', () => {
    expect(() => loadEnv({ ...valid, CORS_ORIGIN: 'localhost' })).toThrow(/CORS_ORIGIN/)
  })

  it('reads the database url', () => {
    expect(loadEnv(valid).databaseUrl).toBe(databaseUrl)
  })

  it('stops when DATABASE_URL is missing', () => {
    expect(() => loadEnv({ CORS_ORIGIN: valid.CORS_ORIGIN })).toThrow(/DATABASE_URL/)
  })

  it('stops when DATABASE_URL is not a postgres url', () => {
    expect(() => loadEnv({ ...valid, DATABASE_URL: 'mysql://localhost/db' })).toThrow(
      /DATABASE_URL/,
    )
  })
})
