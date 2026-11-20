'use client'

import { employeeIdParamSchema, type Employee } from '@salary/shared'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import { useEmployee } from '../hooks/use-employee'
import { useUpdateEmployee } from '../hooks/use-employee-mutations'
import { useReturnPath } from '../hooks/use-return-path'
import { DeleteEmployeeButton } from './delete-employee-button'
import { EmployeeForm } from './employee-form'

function NotFound() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">Employee not found</h1>
      <p className="text-muted-foreground">They may have been deleted, or the link is wrong.</p>
      <Button asChild variant="outline">
        <Link href="/employees">Back to employees</Link>
      </Button>
    </section>
  )
}

function EditForm({ employee }: { employee: Employee }) {
  const returnTo = useReturnPath()
  const update = useUpdateEmployee(employee.id, returnTo)
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{employee.fullName}</h1>
      <EmployeeForm
        // a fresh form per person, so nothing from the last one stays
        key={employee.id}
        defaultValues={employee}
        submitLabel="Save changes"
        onSubmit={(values) => update.mutateAsync(values)}
      >
        <Button asChild variant="ghost">
          <Link href={returnTo}>Cancel</Link>
        </Button>
        <div className="ml-auto">
          <DeleteEmployeeButton employee={employee} returnTo={returnTo} />
        </div>
      </EmployeeForm>
    </section>
  )
}

export function EditEmployeeView({ id }: { id: string }) {
  const parsed = employeeIdParamSchema.safeParse({ id })
  const employee = useEmployee(parsed.success ? parsed.data.id : undefined)

  if (!parsed.success) return <NotFound />
  if (employee.isPending) {
    return (
      <div role="status" aria-label="Loading employee" className="max-w-xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (employee.isError) {
    if (employee.error instanceof ApiError && employee.error.code === 'NOT_FOUND') {
      return <NotFound />
    }
    return (
      <div className="space-y-3">
        <p className="font-medium">
          {employee.error instanceof ApiError
            ? employee.error.message
            : 'Something went wrong. Try again.'}
        </p>
        <Button variant="outline" onClick={() => void employee.refetch()}>
          Try again
        </Button>
      </div>
    )
  }
  return <EditForm employee={employee.data} />
}
