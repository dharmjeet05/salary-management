'use client'

import type { Employee } from '@salary/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'
import { useDeleteEmployee } from '../hooks/use-employee-mutations'

export function DeleteEmployeeButton({
  employee,
  returnTo,
}: {
  employee: Employee
  returnTo: string
}) {
  const remove = useDeleteEmployee(employee, returnTo)
  return (
    <AlertDialog
      onOpenChange={(open) => {
        // no error left over from an earlier try when the dialog opens again
        if (open) remove.reset()
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {employee.fullName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes them from the employee list for good. It can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {remove.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {remove.error instanceof ApiError
              ? remove.error.message
              : 'Something went wrong. Try again.'}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={(event) => {
              // stay open until the delete is done, so a failure shows here
              event.preventDefault()
              remove.mutate()
            }}
          >
            Delete {employee.fullName}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
