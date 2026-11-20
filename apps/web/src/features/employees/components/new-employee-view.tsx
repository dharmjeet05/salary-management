'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useCreateEmployee } from '../hooks/use-employee-mutations'
import { useReturnPath } from '../hooks/use-return-path'
import { EmployeeForm } from './employee-form'

export function NewEmployeeView() {
  const returnTo = useReturnPath()
  const create = useCreateEmployee(returnTo)
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Add employee</h1>
      <EmployeeForm submitLabel="Add employee" onSubmit={(values) => create.mutateAsync(values)}>
        <Button asChild variant="ghost">
          <Link href={returnTo}>Cancel</Link>
        </Button>
      </EmployeeForm>
    </section>
  )
}
