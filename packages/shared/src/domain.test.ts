import { describe, expect, it } from 'vitest'
import {
  COUNTRIES,
  DEPARTMENTS,
  currencyForCountry,
  isJobTitleInDepartment,
  jobTitlesForDepartment,
} from './domain'

describe('countries', () => {
  it('supports the 8 countries from the spec', () => {
    expect(COUNTRIES.map((country) => country.code)).toEqual([
      'IN',
      'US',
      'GB',
      'DE',
      'CA',
      'AU',
      'SG',
      'BR',
    ])
  })

  it('pays people in India in rupees', () => {
    expect(currencyForCountry('IN')).toBe('INR')
  })

  it('pays people in Germany in euros', () => {
    expect(currencyForCountry('DE')).toBe('EUR')
  })

  it('gives every country its own currency', () => {
    const currencies = COUNTRIES.map((country) => country.currency)
    expect(new Set(currencies).size).toBe(COUNTRIES.length)
  })
})

describe('departments and job titles', () => {
  it('has the 10 departments from the spec', () => {
    expect(DEPARTMENTS.map((department) => department.name)).toEqual([
      'Engineering',
      'Product',
      'Design',
      'Data',
      'Sales',
      'Marketing',
      'Customer Support',
      'Finance',
      'People',
      'Operations',
    ])
  })

  it('lists the job titles of a department', () => {
    expect(jobTitlesForDepartment('Product')).toEqual(['Product Manager', 'Senior Product Manager'])
  })

  it('accepts a job title that belongs to the department', () => {
    expect(isJobTitleInDepartment('Engineering', 'Senior Software Engineer')).toBe(true)
  })

  it('rejects a job title from another department', () => {
    expect(isJobTitleInDepartment('Sales', 'Senior Software Engineer')).toBe(false)
  })

  it('uses every job title in only one department', () => {
    const titles = DEPARTMENTS.flatMap((department) => department.jobTitles)
    expect(new Set(titles).size).toBe(titles.length)
  })
})
