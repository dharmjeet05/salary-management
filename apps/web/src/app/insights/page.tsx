import type { Metadata } from 'next'
import { Suspense } from 'react'
import { InsightsView } from '@/features/insights/components/insights-view'

export const metadata: Metadata = { title: 'Insights | Salary Management' }

export default function InsightsPage() {
  // useSearchParams needs a Suspense boundary to keep the page static
  return (
    <Suspense>
      <InsightsView />
    </Suspense>
  )
}
