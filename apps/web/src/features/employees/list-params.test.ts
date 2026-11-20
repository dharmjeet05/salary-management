import { describe, expect, it } from 'vitest'
import { changeListParams, readListParams, writeListParams } from './list-params'

const defaults = readListParams(new URLSearchParams())

describe('reading the list from the url', () => {
  it('uses the defaults for an empty url', () => {
    expect(defaults).toEqual({ page: 1, pageSize: 25, sortBy: 'fullName', sortOrder: 'asc' })
  })

  it('reads search, filters and page', () => {
    const params = readListParams(new URLSearchParams('search=patel&country=IN&page=3'))
    expect(params).toMatchObject({ search: 'patel', country: 'IN', page: 3 })
  })

  it('drops a page size that is not offered and keeps the rest', () => {
    const params = readListParams(new URLSearchParams('pageSize=30&country=IN'))
    expect(params).toMatchObject({ pageSize: 25, country: 'IN' })
  })

  it('drops a salary sort when no country is picked', () => {
    const params = readListParams(new URLSearchParams('sortBy=annualSalary'))
    expect(params.sortBy).toBe('fullName')
  })
})

describe('writing the list to the url', () => {
  it('writes nothing for the default view', () => {
    expect(writeListParams(defaults)).toBe('')
  })

  it('writes only what differs from the defaults', () => {
    expect(writeListParams({ ...defaults, country: 'IN', page: 2 })).toBe('page=2&country=IN')
  })
})

describe('changing the list', () => {
  const onPage3 = { ...defaults, page: 3 }

  it('goes back to page 1 when a filter changes', () => {
    expect(changeListParams(onPage3, { country: 'IN' }).page).toBe(1)
  })

  it('goes back to page 1 when the search changes', () => {
    expect(changeListParams(onPage3, { search: 'ravi' }).page).toBe(1)
  })

  it('keeps the page when only the page changes', () => {
    expect(changeListParams(onPage3, { page: 4 }).page).toBe(4)
  })

  it('clears the job title when the new department does not have it', () => {
    const engineer = {
      ...defaults,
      department: 'Engineering',
      jobTitle: 'Software Engineer',
    } as const
    expect(changeListParams(engineer, { department: 'Sales' }).jobTitle).toBeUndefined()
  })

  it('keeps the job title when the new department has it', () => {
    const engineer = { ...defaults, jobTitle: 'Software Engineer' } as const
    expect(changeListParams(engineer, { department: 'Engineering' }).jobTitle).toBe(
      'Software Engineer',
    )
  })

  it('drops the salary sort when the country is cleared', () => {
    const bySalary = {
      ...defaults,
      country: 'IN',
      sortBy: 'annualSalary',
      sortOrder: 'desc',
    } as const
    expect(changeListParams(bySalary, { country: undefined })).toMatchObject({
      sortBy: 'fullName',
      sortOrder: 'asc',
    })
  })
})
