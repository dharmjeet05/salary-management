import type { Metadata } from 'next'
import { NewEmployeeView } from '@/features/employees/components/new-employee-view'

export const metadata: Metadata = { title: 'Add employee | Salary Management' }

export default function NewEmployeePage() {
  return <NewEmployeeView />
}
