'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { readInsightsParams, writeInsightsParams, type InsightsParams } from '../insights-params'

export function useInsightsParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const params = useMemo(() => readInsightsParams(searchParams), [searchParams])

  const setParams = useCallback(
    (change: Partial<InsightsParams>) => {
      const query = writeInsightsParams({ ...params, ...change })
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [params, pathname, router],
  )

  return { params, setParams }
}
