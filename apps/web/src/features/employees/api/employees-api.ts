import {
  employeeListResponseSchema,
  employeeSchema,
  type CreateEmployeeInput,
  type EmployeeListQuery,
  type UpdateEmployeeInput,
} from '@salary/shared'
import { apiDelete, apiFetch } from '@/lib/api-client'

export function fetchEmployees(query: EmployeeListQuery) {
  return apiFetch('/api/employees', employeeListResponseSchema, { query })
}

export function fetchEmployee(id: number) {
  return apiFetch(`/api/employees/${String(id)}`, employeeSchema)
}

export function createEmployee(input: CreateEmployeeInput) {
  return apiFetch('/api/employees', employeeSchema, { method: 'POST', body: input })
}

export function updateEmployee(id: number, input: UpdateEmployeeInput) {
  return apiFetch(`/api/employees/${String(id)}`, employeeSchema, { method: 'PATCH', body: input })
}

export function deleteEmployee(id: number) {
  return apiDelete(`/api/employees/${String(id)}`)
}
