import { employeeListResponseSchema, type EmployeeListQuery } from '@salary/shared'
import { apiFetch } from '@/lib/api-client'

export function fetchEmployees(query: EmployeeListQuery) {
  return apiFetch('/api/employees', employeeListResponseSchema, { query })
}
