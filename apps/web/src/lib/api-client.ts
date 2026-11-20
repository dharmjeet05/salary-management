import { apiErrorSchema, type ErrorCode, type ErrorDetail } from '@salary/shared'
import { z } from 'zod'

// The api's own codes, plus two for when its answer never arrives or
// can't be read
export type ClientErrorCode = ErrorCode | 'NETWORK_ERROR' | 'BAD_RESPONSE'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ClientErrorCode,
    message: string,
    readonly details: ErrorDetail[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type Query = Record<string, string | number | undefined>

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Query
}

function badResponse(status: number) {
  return new ApiError(
    status,
    'BAD_RESPONSE',
    'The server sent an answer we could not read. Try again later.',
  )
}

function apiUrl(path: string, query: Query = {}) {
  const base = z.url().safeParse(process.env.NEXT_PUBLIC_API_URL)
  if (!base.success) throw new Error('NEXT_PUBLIC_API_URL must be set to the api url')
  // Joined as text, not with new URL(path, base), which would drop a path
  // prefix like /salary-management
  const url = `${base.data.replace(/\/$/, '')}${path}`
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `${url}?${search}` : url
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

async function request(path: string, { method = 'GET', body, query }: RequestOptions = {}) {
  let response: Response
  try {
    response = await fetch(apiUrl(path, query), {
      method,
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
    })
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Could not reach the server. Check your connection and try again.',
    )
  }
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(await readJson(response))
    if (!parsed.success) throw badResponse(response.status)
    const { code, message, details } = parsed.data.error
    throw new ApiError(response.status, code, message, details)
  }
  return response
}

export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const response = await request(path, options)
  const parsed = schema.safeParse(await readJson(response))
  if (!parsed.success) throw badResponse(response.status)
  return parsed.data
}

export async function apiDelete(path: string): Promise<void> {
  await request(path, { method: 'DELETE' })
}
