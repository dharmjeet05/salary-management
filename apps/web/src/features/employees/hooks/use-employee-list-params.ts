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

  // Only the filters. The sort and rows per page are how the person likes to
  // read the list, not what they were looking for.
  const clearFilters = useCallback(() => {
    setParams({ search: undefined, country: undefined, department: undefined, jobTitle: undefined })
  }, [setParams])

  return { params, setParams, clearFilters }
}
