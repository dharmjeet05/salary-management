'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ApiError } from './api-client'

// Retry only what can change on a second try: a lost connection or a 5xx.
// A 4xx, a 200 whose body didn't match, or a setup error comes back the same.
export function shouldRetry(failureCount: number, error: Error) {
  if (!(error instanceof ApiError)) return false
  if (error.status > 0 && error.status < 500) return false
  return failureCount < 2
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: shouldRetry } },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
