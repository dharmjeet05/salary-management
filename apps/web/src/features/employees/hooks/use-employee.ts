'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchEmployee } from '../api/employees-api'

export function employeeQueryKey(id: number) {
  return ['employee', id] as const
}

export function useEmployee(id: number | undefined) {
  return useQuery({
    queryKey: employeeQueryKey(id ?? 0),
    queryFn: () => {
      if (id === undefined) throw new Error('useEmployee needs an id')
      return fetchEmployee(id)
    },
    enabled: id !== undefined,
  })
}
