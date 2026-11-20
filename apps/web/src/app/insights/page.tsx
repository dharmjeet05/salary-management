import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Insights | Salary Management' }

export default function InsightsPage() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
      <p className="text-muted-foreground">Pay by country, job title and department comes next.</p>
    </section>
  )
}
