import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Employees | Salary Management' }

export default function EmployeesPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
      <p className="text-muted-foreground">The employee list comes next.</p>
    </section>
  )
}
