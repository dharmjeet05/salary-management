import { describe, expect, it } from 'vitest'
import { ApiError } from './api-client'
import { shouldRetry } from './query-provider'

describe('retrying a failed request', () => {
  it('does not retry a 404, the answer will not change', () => {
    expect(shouldRetry(0, new ApiError(404, 'NOT_FOUND', 'Employee not found'))).toBe(false)
  })

  it('does not retry a 200 whose body could not be read, the same body would come back', () => {
    expect(shouldRetry(0, new ApiError(200, 'BAD_RESPONSE', 'x'))).toBe(false)
  })

  it('retries a 502 from a proxy', () => {
    expect(shouldRetry(0, new ApiError(502, 'BAD_RESPONSE', 'x'))).toBe(true)
  })

  it('retries a failed connection', () => {
    expect(shouldRetry(0, new ApiError(0, 'NETWORK_ERROR', 'x'))).toBe(true)
  })

  it('does not retry an error that never reached the api, like a missing api url', () => {
    expect(shouldRetry(0, new Error('NEXT_PUBLIC_API_URL must be set to the api url'))).toBe(false)
  })

  it('gives up after two retries', () => {
    expect(shouldRetry(2, new ApiError(0, 'NETWORK_ERROR', 'x'))).toBe(false)
  })
})
