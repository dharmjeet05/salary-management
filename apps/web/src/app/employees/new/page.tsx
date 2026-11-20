import type { Metadata } from 'next'
import { Suspense } from 'react'
import { NewEmployeeView } from '@/features/employees/components/new-employee-view'

export const metadata: Metadata = { title: 'Add employee | Salary Management' }

export default function NewEmployeePage() {
  // useSearchParams needs a Suspense boundary to keep the page static
  return (
    <Suspense>
      <NewEmployeeView />
    </Suspense>
  )
}
