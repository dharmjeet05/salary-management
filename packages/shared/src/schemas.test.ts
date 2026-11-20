import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  countryParamSchema,
  employeeIdParamSchema,
  createEmployeeSchema,
  employeeListQuerySchema,
  underpaidQuerySchema,
  updateEmployeeSchema,
} from './schemas'

const validEmployee = {
  fullName: 'Asha Patel',
  email: 'asha.patel@acme.test',
  country: 'IN',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  annualSalary: 1800000,
  hireDate: '2022-04-11',
}

function firstIssue(result: {
  success: boolean
  error?: { issues: { path: PropertyKey[]; message: string }[] }
}) {
  const issue = result.error?.issues[0]
  return { path: issue?.path.join('.'), message: issue?.message }
}

beforeEach(() => {
  vi.useFakeTimers()
  // 08:00 UTC: it is 20 Nov in India and not yet 21 Nov anywhere, even at UTC+14
  vi.setSystemTime(new Date('2026-11-20T08:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('creating an employee', () => {
  it('accepts a complete employee', () => {
    expect(createEmployeeSchema.safeParse(validEmployee).success).toBe(true)
  })

  it('trims the name and stores the email in lower case', () => {
    const result = createEmployeeSchema.parse({
      ...validEmployee,
      fullName: '  Asha Patel  ',
      email: 'Asha.Patel@ACME.test',
    })
    expect(result.fullName).toBe('Asha Patel')
    expect(result.email).toBe('asha.patel@acme.test')
  })

  it('does not take a currency from the client', () => {
    const result = createEmployeeSchema.parse({ ...validEmployee, currency: 'USD' })
    expect(result).not.toHaveProperty('currency')
  })

  it('rejects a name shorter than 2 characters', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, fullName: ' A ' })
    expect(firstIssue(result)).toEqual({
      path: 'fullName',
      message: 'Name must be at least 2 characters',
    })
  })

  it('rejects a name longer than 100 characters', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, fullName: 'A'.repeat(101) })
    expect(firstIssue(result).path).toBe('fullName')
  })

  it('rejects an invalid email', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, email: 'asha.patel' })
    expect(firstIssue(result)).toEqual({ path: 'email', message: 'Enter a valid email' })
  })

  it('rejects a country we do not support', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, country: 'FR' })
    expect(firstIssue(result)).toEqual({ path: 'country', message: 'Pick a country from the list' })
  })

  it('rejects a job title from another department', () => {
    const result = createEmployeeSchema.safeParse({
      ...validEmployee,
      department: 'Sales',
      jobTitle: 'Software Engineer',
    })
    expect(firstIssue(result)).toEqual({
      path: 'jobTitle',
      message: 'Software Engineer is not a job title in Sales',
    })
  })

  it('rejects a salary of 0', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, annualSalary: 0 })
    expect(firstIssue(result)).toEqual({
      path: 'annualSalary',
      message: 'Salary must be more than 0',
    })
  })

  it('rejects a salary with decimals', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, annualSalary: 1800000.5 })
    expect(firstIssue(result)).toEqual({
      path: 'annualSalary',
      message: 'Salary must be a whole number',
    })
  })

  it('rejects a salary above 100,000,000', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, annualSalary: 100_000_001 })
    expect(firstIssue(result).path).toBe('annualSalary')
  })

  it('accepts someone hired today', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, hireDate: '2026-11-20' })
    expect(result.success).toBe(true)
  })

  it('rejects a hire date in the future', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, hireDate: '2026-11-21' })
    expect(firstIssue(result)).toEqual({
      path: 'hireDate',
      message: 'Hire date cannot be in the future',
    })
  })

  it("accepts today's date in India while UTC is still on the day before", () => {
    vi.setSystemTime(new Date('2026-11-20T21:30:00Z'))
    const result = createEmployeeSchema.safeParse({ ...validEmployee, hireDate: '2026-11-21' })
    expect(result.success).toBe(true)
  })

  it('accepts a hire date on 1 January 1950', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, hireDate: '1950-01-01' })
    expect(result.success).toBe(true)
  })

  it('rejects a hire date before 1950', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, hireDate: '1949-12-31' })
    expect(firstIssue(result)).toEqual({
      path: 'hireDate',
      message: 'Hire date cannot be before 1950',
    })
  })

  it('rejects a date that does not exist', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, hireDate: '2026-02-30' })
    expect(firstIssue(result)).toEqual({ path: 'hireDate', message: 'Enter a date as YYYY-MM-DD' })
  })

  it('asks for a JSON object when the body is not one', () => {
    const result = createEmployeeSchema.safeParse(undefined)
    expect(firstIssue(result)).toEqual({ path: '', message: 'Send the employee as a JSON object' })
  })

  it('asks for a name when it is missing', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, fullName: undefined })
    expect(firstIssue(result)).toEqual({ path: 'fullName', message: 'Enter a name' })
  })

  it('asks for an email when it is missing', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, email: undefined })
    expect(firstIssue(result)).toEqual({ path: 'email', message: 'Enter an email' })
  })
})

describe('updating an employee', () => {
  it('accepts a change to one field', () => {
    expect(updateEmployeeSchema.parse({ annualSalary: 2000000 })).toEqual({ annualSalary: 2000000 })
  })

  it('asks for a JSON object when the update body is not one', () => {
    const result = updateEmployeeSchema.safeParse(undefined)
    expect(firstIssue(result).message).toBe('Send the employee as a JSON object')
  })

  it('rejects an update with no fields', () => {
    const result = updateEmployeeSchema.safeParse({})
    expect(firstIssue(result).message).toBe('Send at least one field to change')
  })

  it('rejects an update where every field is undefined', () => {
    const result = updateEmployeeSchema.safeParse({ email: undefined })
    expect(firstIssue(result).message).toBe('Send at least one field to change')
  })

  it('rejects a job title from another department when both are sent', () => {
    const result = updateEmployeeSchema.safeParse({
      department: 'Sales',
      jobTitle: 'Software Engineer',
    })
    expect(firstIssue(result).path).toBe('jobTitle')
  })

  it('accepts a job title on its own, since the stored department is checked later', () => {
    expect(updateEmployeeSchema.safeParse({ jobTitle: 'Software Engineer' }).success).toBe(true)
  })

  it('applies the same rules as create to each field', () => {
    const result = updateEmployeeSchema.safeParse({ email: 'not-an-email' })
    expect(firstIssue(result)).toEqual({ path: 'email', message: 'Enter a valid email' })
  })
})

describe('listing employees', () => {
  it('uses the spec defaults when nothing is sent', () => {
    expect(employeeListQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 25,
      sortBy: 'fullName',
      sortOrder: 'asc',
    })
  })

  it('reads numbers from the query string', () => {
    const result = employeeListQuerySchema.parse({ page: '3', pageSize: '50' })
    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(50)
  })

  it('rejects a page size that is not offered', () => {
    const result = employeeListQuerySchema.safeParse({ pageSize: '30' })
    expect(firstIssue(result).path).toBe('pageSize')
  })

  it('rejects page 0', () => {
    const result = employeeListQuerySchema.safeParse({ page: '0' })
    expect(firstIssue(result).path).toBe('page')
  })

  it('treats an empty search box as no search', () => {
    expect(employeeListQuerySchema.parse({ search: '  ' }).search).toBeUndefined()
  })

  it('rejects a one letter search', () => {
    const result = employeeListQuerySchema.safeParse({ search: 'a' })
    expect(firstIssue(result).path).toBe('search')
  })

  it('accepts filters for country, department and job title', () => {
    const result = employeeListQuerySchema.parse({
      country: 'IN',
      department: 'Engineering',
      jobTitle: 'Software Engineer',
    })
    expect(result).toMatchObject({
      country: 'IN',
      department: 'Engineering',
      jobTitle: 'Software Engineer',
    })
  })

  it('rejects an unknown country filter', () => {
    const result = employeeListQuerySchema.safeParse({ country: 'XX' })
    expect(firstIssue(result).path).toBe('country')
  })

  it('sorts by salary when a country is picked', () => {
    const result = employeeListQuerySchema.safeParse({ country: 'IN', sortBy: 'annualSalary' })
    expect(result.success).toBe(true)
  })

  it('refuses to sort by salary across countries', () => {
    const result = employeeListQuerySchema.safeParse({ sortBy: 'annualSalary' })
    expect(firstIssue(result)).toEqual({
      path: 'sortBy',
      message: 'Pick a country to sort by salary, since each country pays in its own currency',
    })
  })

  it('rejects sorting by a column that is not offered', () => {
    const result = employeeListQuerySchema.safeParse({ sortBy: 'email' })
    expect(firstIssue(result).path).toBe('sortBy')
  })
})

describe('insight params', () => {
  it('accepts a supported country code', () => {
    expect(countryParamSchema.parse({ country: 'GB' })).toEqual({ country: 'GB' })
  })

  it('rejects a lower case country code', () => {
    expect(countryParamSchema.safeParse({ country: 'gb' }).success).toBe(false)
  })

  it('uses 80% of the median as the underpaid line by default', () => {
    expect(underpaidQuerySchema.parse({})).toEqual({ threshold: 0.8 })
  })

  it('reads the underpaid threshold from the query string', () => {
    expect(underpaidQuerySchema.parse({ threshold: '0.7' })).toEqual({ threshold: 0.7 })
  })

  it('rejects a threshold of 0', () => {
    expect(underpaidQuerySchema.safeParse({ threshold: '0' }).success).toBe(false)
  })

  it('rejects a threshold above 1', () => {
    expect(underpaidQuerySchema.safeParse({ threshold: '1.2' }).success).toBe(false)
  })
})

describe('employee id in the url', () => {
  it('reads the id as a number', () => {
    expect(employeeIdParamSchema.parse({ id: '42' })).toEqual({ id: 42 })
  })

  it('rejects an id that is not a number with a plain message', () => {
    const result = employeeIdParamSchema.safeParse({ id: 'abc' })
    expect(firstIssue(result)).toEqual({
      path: 'id',
      message: 'Employee id must be a positive whole number',
    })
  })

  it('rejects id 0', () => {
    expect(employeeIdParamSchema.safeParse({ id: '0' }).success).toBe(false)
  })

  it('accepts the largest id postgres can store', () => {
    expect(employeeIdParamSchema.parse({ id: '2147483647' })).toEqual({ id: 2147483647 })
  })

  it('rejects an id above what postgres can store', () => {
    expect(employeeIdParamSchema.safeParse({ id: '2147483648' }).success).toBe(false)
  })

  it('rejects a hex id', () => {
    expect(employeeIdParamSchema.safeParse({ id: '0x10' }).success).toBe(false)
  })

  it('rejects an id written as a power of ten', () => {
    expect(employeeIdParamSchema.safeParse({ id: '1e3' }).success).toBe(false)
  })
})
