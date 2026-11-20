import type { Metadata } from 'next'
import { EditEmployeeView } from '@/features/employees/components/edit-employee-view'

export const metadata: Metadata = { title: 'Edit employee | Salary Management' }

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditEmployeeView id={id} />
}
