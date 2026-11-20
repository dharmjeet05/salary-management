import type { Metadata } from 'next'
import { Suspense } from 'react'
import { EmployeesView } from '@/features/employees/components/employees-view'

export const metadata: Metadata = { title: 'Employees | Salary Management' }

export default function EmployeesPage() {
  // useSearchParams needs a Suspense boundary to keep the page static
  return (
    <Suspense>
      <EmployeesView />
    </Suspense>
  )
}
