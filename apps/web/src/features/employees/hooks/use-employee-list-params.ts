'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { changeListParams, readListParams, writeListParams, type ListParams } from '../list-params'

export function useEmployeeListParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const params = useMemo(() => readListParams(searchParams), [searchParams])

  const setParams = useCallback(
    (change: Partial<ListParams>) => {
      const query = writeListParams(changeListParams(params, change))
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [params, pathname, router],
  )

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [pathname, router])

  return { params, setParams, clearFilters }
}
