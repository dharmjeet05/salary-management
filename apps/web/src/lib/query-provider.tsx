'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ApiError } from './api-client'

// A 4xx won't change on a retry, so only retry network trouble and 5xx
function shouldRetry(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
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
