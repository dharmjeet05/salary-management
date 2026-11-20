'use client'

import { useCreateEmployee } from '../hooks/use-employee-mutations'
import { EmployeeForm } from './employee-form'

export function NewEmployeeView() {
  const create = useCreateEmployee()
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add employee</h1>
      <EmployeeForm submitLabel="Add employee" onSubmit={(values) => create.mutateAsync(values)} />
    </section>
  )
}
