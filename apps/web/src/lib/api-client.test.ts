import { employeeSchema } from '@salary/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiDelete, apiFetch } from './api-client'

const asha = {
  id: 1,
  fullName: 'Asha Patel',
  email: 'asha.patel@acme.test',
  country: 'IN',
  currency: 'INR',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  annualSalary: 1800000,
  hireDate: '2022-04-11',
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test')
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1) ?? []
  return { url: String(url), init }
}

describe('api client', () => {
  it('returns the body parsed with the schema', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, asha))
    expect(await apiFetch('/api/employees/1', employeeSchema)).toEqual(asha)
  })

  it('calls the api url from NEXT_PUBLIC_API_URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, asha))
    await apiFetch('/api/employees/1', employeeSchema)
    expect(lastRequest().url).toBe('http://api.test/api/employees/1')
  })

  it('puts the query in the url and leaves out empty values', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, asha))
    await apiFetch('/api/employees/1', employeeSchema, {
      query: { country: 'IN', search: undefined, page: 2 },
    })
    expect(lastRequest().url).toBe('http://api.test/api/employees/1?country=IN&page=2')
  })

  it('sends a body as JSON with the method', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, asha))
    await apiFetch('/api/employees', employeeSchema, { method: 'POST', body: { fullName: 'Asha' } })
    expect(lastRequest().init).toMatchObject({
      method: 'POST',
      body: '{"fullName":"Asha"}',
      headers: { 'Content-Type': 'application/json' },
    })
  })

  it('throws the error from the api with its code and field details', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        error: {
          code: 'EMAIL_TAKEN',
          message: 'This email is already used by another employee',
          details: [{ path: 'email', message: 'This email is already used by another employee' }],
        },
      }),
    )
    await expect(apiFetch('/api/employees', employeeSchema)).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
      message: 'This email is already used by another employee',
      details: [{ path: 'email', message: 'This email is already used by another employee' }],
    })
  })

  it('throws an ApiError, so callers can check for it', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, { error: { code: 'NOT_FOUND', message: 'Employee not found' } }),
    )
    await expect(apiFetch('/api/employees/9', employeeSchema)).rejects.toBeInstanceOf(ApiError)
  })

  it('refuses a success body that does not match the schema', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ...asha, currency: 'XYZ' }))
    await expect(apiFetch('/api/employees/1', employeeSchema)).rejects.toMatchObject({
      code: 'BAD_RESPONSE',
    })
  })

  it('reports an error page that is not JSON as a bad response', async () => {
    fetchMock.mockResolvedValue(new Response('<html>502 Bad Gateway</html>', { status: 502 }))
    await expect(apiFetch('/api/employees/1', employeeSchema)).rejects.toMatchObject({
      status: 502,
      code: 'BAD_RESPONSE',
    })
  })

  it('reports a failed connection as a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(apiFetch('/api/employees/1', employeeSchema)).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Could not reach the server. Check your connection and try again.',
    })
  })

  it('resolves a delete that answers 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(apiDelete('/api/employees/1')).resolves.toBeUndefined()
  })
})
