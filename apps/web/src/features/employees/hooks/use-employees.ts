'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchEmployees } from '../api/employees-api'
import type { ListParams } from '../list-params'

export function useEmployees(params: ListParams) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () => fetchEmployees(params),
    // keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
  })
}
