import {
  employeeListQuerySchema,
  isJobTitleInDepartment,
  type EmployeeListQuery,
  type SortField,
} from '@salary/shared'

export type ListParams = EmployeeListQuery

const DEFAULTS = employeeListQuerySchema.parse({})

// Also the order they appear in the url
const KEYS = [
  'page',
  'pageSize',
  'search',
  'country',
  'department',
  'jobTitle',
  'sortBy',
  'sortOrder',
] as const

// A hand edited or old url can hold a value the api would refuse. Drop each
// bad value and keep the rest, so the page still shows a list.
export function readListParams(search: { get(name: string): string | null }): ListParams {
  const raw: Record<string, string> = {}
  for (const key of KEYS) {
    const value = search.get(key)
    if (value !== null) raw[key] = value
  }
  for (let attempt = 0; attempt <= KEYS.length; attempt++) {
    const result = employeeListQuerySchema.safeParse(raw)
    if (result.success) return result.data
    for (const issue of result.error.issues) {
      const [key] = issue.path
      if (typeof key === 'string') delete raw[key]
    }
  }
  return DEFAULTS
}

export function writeListParams(params: ListParams) {
  const query = new URLSearchParams()
  for (const key of KEYS) {
    const value = params[key]
    if (value !== undefined && value !== DEFAULTS[key]) query.set(key, String(value))
  }
  return query.toString()
}

export function changeListParams(current: ListParams, change: Partial<ListParams>): ListParams {
  const next: ListParams = { ...current, ...change }
  const onlyPageChanged = Object.keys(change).every((key) => key === 'page')
  if (!onlyPageChanged) next.page = change.page ?? 1
  if (next.department && next.jobTitle && !isJobTitleInDepartment(next.department, next.jobTitle)) {
    next.jobTitle = undefined
  }
  if (next.sortBy === 'annualSalary' && next.country === undefined) {
    next.sortBy = 'fullName'
    next.sortOrder = 'asc'
  }
  return next
}

export function sortChange(current: ListParams, field: SortField): Partial<ListParams> {
  if (current.sortBy === field) {
    return { sortBy: field, sortOrder: current.sortOrder === 'asc' ? 'desc' : 'asc' }
  }
  return { sortBy: field, sortOrder: 'asc' }
}
