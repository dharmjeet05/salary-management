'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-client'
import { useEmployeeListParams } from '../hooks/use-employee-list-params'
import { useEmployees } from '../hooks/use-employees'
import { useSearchInput } from '../hooks/use-search-input'
import { sortChange, writeListParams } from '../list-params'
import { withReturnTo } from '../return-to'
import { EmployeeFilters } from './employee-filters'
import { EmployeePagination } from './employee-pagination'
import { EmployeeTable } from './employee-table'

function LoadingRows() {
  return (
    <div role="status" aria-label="Loading employees" className="space-y-2">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  )
}

function Message({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-3 flex justify-center">{children}</div> : null}
    </div>
  )
}

function countLabel(total: number) {
  return `${total.toLocaleString('en')} ${total === 1 ? 'employee' : 'employees'}`
}

export function EmployeesView() {
  const { params, setParams, clearFilters } = useEmployeeListParams()
  const list = useEmployees(params)
  const search = useSearchInput(params.search, (value) => {
    setParams({ search: value })
  })
  const listQuery = writeListParams(params)
  const returnTo = listQuery ? `/employees?${listQuery}` : '/employees'
  const hasFilters = Boolean(
    params.search ?? params.country ?? params.department ?? params.jobTitle,
  )

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-muted-foreground h-5 text-sm">
            {list.data ? countLabel(list.data.total) : null}
          </p>
        </div>
        <Button asChild>
          <Link href={withReturnTo('/employees/new', returnTo)}>
            <Plus aria-hidden />
            Add employee
          </Link>
        </Button>
      </div>

      <EmployeeFilters
        params={params}
        searchText={search.text}
        onSearchTextChange={search.setText}
        onChange={setParams}
      />

      {list.isPending ? (
        <LoadingRows />
      ) : list.isError ? (
        <Message
          title={
            list.error instanceof ApiError ? list.error.message : 'Something went wrong. Try again.'
          }
        >
          <Button variant="outline" onClick={() => void list.refetch()}>
            Try again
          </Button>
        </Message>
      ) : list.data.data.length === 0 && list.data.total > 0 ? (
        <Message title="This page is past the end of the list">
          <Button
            variant="outline"
            onClick={() => {
              setParams({ page: 1 })
            }}
          >
            Go to the first page
          </Button>
        </Message>
      ) : list.data.data.length === 0 ? (
        <Message title={hasFilters ? 'No employees match your filters' : 'No employees yet'}>
          {hasFilters ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </Message>
      ) : (
        <div
          className={
            list.isPlaceholderData ? 'space-y-4 opacity-60 transition-opacity' : 'space-y-4'
          }
          aria-busy={list.isPlaceholderData}
        >
          <div className="rounded-lg border">
            <EmployeeTable
              employees={list.data.data}
              sortBy={params.sortBy}
              sortOrder={params.sortOrder}
              canSortBySalary={params.country !== undefined}
              returnTo={returnTo}
              onSort={(field) => {
                setParams(sortChange(params, field))
              }}
            />
          </div>
          <EmployeePagination
            page={params.page}
            pageSize={params.pageSize}
            total={list.data.total}
            onPageChange={(page) => {
              setParams({ page })
            }}
            onPageSizeChange={(pageSize) => {
              setParams({ pageSize })
            }}
          />
        </div>
      )}
    </section>
  )
}
