import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  countryParamSchema,
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

function firstIssue(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  const issue = result.error?.issues[0]
  return { path: issue?.path.join('.'), message: issue?.message }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-20T10:00:00Z'))
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

  it('rejects a date that does not exist', () => {
    const result = createEmployeeSchema.safeParse({ ...validEmployee, hireDate: '2026-02-30' })
    expect(firstIssue(result)).toEqual({ path: 'hireDate', message: 'Enter a date as YYYY-MM-DD' })
  })

  it('rejects a missing field', () => {
    const { email: _email, ...withoutEmail } = validEmployee
    const result = createEmployeeSchema.safeParse(withoutEmail)
    expect(firstIssue(result).path).toBe('email')
  })
})

describe('updating an employee', () => {
  it('accepts a change to one field', () => {
    expect(updateEmployeeSchema.parse({ annualSalary: 2000000 })).toEqual({ annualSalary: 2000000 })
  })

  it('rejects an update with no fields', () => {
    const result = updateEmployeeSchema.safeParse({})
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
    expect(employeeListQuerySchema.parse({ search: '  ' })).not.toHaveProperty('search')
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
