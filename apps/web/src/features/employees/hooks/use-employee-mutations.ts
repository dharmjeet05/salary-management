'use client'

import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from '@salary/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createEmployee, deleteEmployee, updateEmployee } from '../api/employees-api'
import { employeeQueryKey } from './use-employee'

// Every change ends the same way: the list is refetched so it never shows old
// data, a toast says what happened, and the person is back on the list.

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: async (employee) => {
      queryClient.setQueryData(employeeQueryKey(employee.id), employee)
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success(`${employee.fullName} was added`)
      router.push('/employees')
    },
  })
}

export function useUpdateEmployee(id: number) {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => updateEmployee(id, input),
    onSuccess: async (employee) => {
      queryClient.setQueryData(employeeQueryKey(id), employee)
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success(`Changes to ${employee.fullName} were saved`)
      router.push('/employees')
    },
  })
}

export function useDeleteEmployee(employee: Employee) {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: () => deleteEmployee(employee.id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: employeeQueryKey(employee.id) })
      await queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success(`${employee.fullName} was deleted`)
      router.push('/employees')
    },
  })
}
