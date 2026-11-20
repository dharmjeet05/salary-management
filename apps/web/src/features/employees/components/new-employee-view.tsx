'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCreateEmployee } from '../hooks/use-employee-mutations'
import { EmployeeForm } from './employee-form'

export function NewEmployeeView() {
  const create = useCreateEmployee()
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add employee</h1>
      <EmployeeForm submitLabel="Add employee" onSubmit={(values) => create.mutateAsync(values)}>
        <Button asChild variant="ghost">
          <Link href="/employees">Cancel</Link>
        </Button>
      </EmployeeForm>
    </section>
  )
}
