'use client'

import { COUNTRIES } from '@salary/shared'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import {
  useCountryInsights,
  useDepartmentInsights,
  useJobTitleInsights,
  useUnderpaid,
} from '../hooks/use-insights'
import { useInsightsParams } from '../hooks/use-insights-params'
import { THRESHOLDS, writeInsightsParams } from '../insights-params'
import { CountryTable } from './country-table'
import { DepartmentTable } from './department-table'
import { JobTitleTable } from './job-title-table'
import { UnderpaidTable } from './underpaid-table'

const countryNames = new Map(COUNTRIES.map((country) => [country.code, country.name]))

function percent(threshold: number) {
  return `${String(Math.round(threshold * 100))}%`
}

type QueryBlockProps<T> = {
  query: UseQueryResult<T>
  loadingLabel: string
  children: (data: T) => ReactNode
}

// Loading, error and data for one part of the page, so each part can fail or
// load on its own
function QueryBlock<T>({ query, loadingLabel, children }: QueryBlockProps<T>) {
  if (query.isPending) {
    return (
      <div role="status" aria-label={loadingLabel} className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    )
  }
  if (query.isError) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-8 text-center">
        <p className="font-medium">
          {query.error instanceof ApiError
            ? query.error.message
            : 'Something went wrong. Try again.'}
        </p>
        <Button variant="outline" className="mt-3" onClick={() => void query.refetch()}>
          Try again
        </Button>
      </div>
    )
  }
  return <div className="rounded-lg border">{children(query.data)}</div>
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function InsightsView() {
  const { params, setParams } = useInsightsParams()
  const overview = useCountryInsights()
  // the biggest country opens when the url names none
  const country = params.country ?? overview.data?.countries[0]?.country
  const jobTitles = useJobTitleInsights(country)
  const departments = useDepartmentInsights(country)
  const underpaid = useUnderpaid(country, params.threshold)

  const countryName = country ? countryNames.get(country) : undefined
  // the overview leaves out countries with nobody in them
  const isEmptyCountry =
    overview.data !== undefined && !overview.data.countries.some((row) => row.country === country)
  const query = writeInsightsParams({ ...params, country })
  const returnTo = query ? `/insights?${query}` : '/insights'

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <p className="text-muted-foreground text-sm">
          How ACME pays people. Each country is shown in its own currency.
        </p>
      </div>

      <Section title="Pay by country" description="Pick a country to see it in detail.">
        <QueryBlock query={overview} loadingLabel="Loading pay by country">
          {(data) => (
            <CountryTable
              countries={data.countries}
              selected={country}
              onSelect={(next) => {
                setParams({ country: next })
              }}
            />
          )}
        </QueryBlock>
      </Section>

      {country && countryName ? (
        <>
          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold tracking-tight">{countryName}</h2>
          </div>

          {isEmptyCountry ? (
            <p className="text-muted-foreground rounded-lg border border-dashed px-6 py-8 text-center">
              Nobody works in {countryName} yet
            </p>
          ) : (
            <>
              <Section title="Cost by department" description="Total yearly salary per department.">
                <QueryBlock query={departments} loadingLabel="Loading cost by department">
                  {(data) => <DepartmentTable insights={data} />}
                </QueryBlock>
              </Section>

              <Section title="Pay by job title">
                <QueryBlock query={jobTitles} loadingLabel="Loading pay by job title">
                  {(data) => <JobTitleTable insights={data} />}
                </QueryBlock>
              </Section>

              <Section
                title="Paid well below their peers"
                description={`People paid under ${percent(params.threshold)} of the median for their job title in ${countryName}.`}
                action={
                  <NativeSelect
                    aria-label="How far below the median"
                    value={String(params.threshold)}
                    onChange={(event) => {
                      const threshold = THRESHOLDS.find(
                        (value) => String(value) === event.target.value,
                      )
                      if (threshold !== undefined) setParams({ threshold })
                    }}
                  >
                    {THRESHOLDS.map((value) => (
                      <NativeSelectOption key={value} value={String(value)}>
                        Under {percent(value)} of the median
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                }
              >
                {underpaid.data?.employees.length === 0 ? (
                  <p className="text-muted-foreground rounded-lg border border-dashed px-6 py-8 text-center">
                    Nobody in {countryName} is under {percent(params.threshold)} of the median for
                    their job title
                  </p>
                ) : (
                  <QueryBlock
                    query={underpaid}
                    loadingLabel="Loading people paid below their peers"
                  >
                    {(data) => <UnderpaidTable underpaid={data} returnTo={returnTo} />}
                  </QueryBlock>
                )}
              </Section>
            </>
          )}
        </>
      ) : null}
    </div>
  )
}
