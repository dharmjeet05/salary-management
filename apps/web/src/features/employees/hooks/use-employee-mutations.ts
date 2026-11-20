'use client'

import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from '@salary/shared'
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createEmployee, deleteEmployee, updateEmployee } from '../api/employees-api'
import { employeeQueryKey } from './use-employee'

// Every change ends the same way: the list and the insights are refetched so
// they never show old data, a toast says what happened, and the person is
// back where they came from.

// Insights too: a fixed salary has to leave the underpaid list
function refreshLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['employees'] }),
    queryClient.invalidateQueries({ queryKey: ['insights'] }),
  ])
}

export function useCreateEmployee(returnTo: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: async (employee) => {
      queryClient.setQueryData(employeeQueryKey(employee.id), employee)
      await refreshLists(queryClient)
      toast.success(`${employee.fullName} was added`)
      router.push(returnTo)
    },
  })
}

export function useUpdateEmployee(id: number, returnTo: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => updateEmployee(id, input),
    onSuccess: async (employee) => {
      queryClient.setQueryData(employeeQueryKey(id), employee)
      await refreshLists(queryClient)
      toast.success(`Changes to ${employee.fullName} were saved`)
      router.push(returnTo)
    },
  })
}

export function useDeleteEmployee(employee: Employee, returnTo: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: () => deleteEmployee(employee.id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: employeeQueryKey(employee.id) })
      await refreshLists(queryClient)
      toast.success(`${employee.fullName} was deleted`)
      router.push(returnTo)
    },
  })
}
