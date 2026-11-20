import { COUNTRIES, createEmployeeSchema, currencyForCountry } from '@salary/shared'
import { describe, expect, it } from 'vitest'
import { generateEmployees } from './generate-employees'

const employees = generateEmployees({ count: 10_000, seed: 42 })

describe('generating seed employees', () => {
  it('makes exactly 10,000 employees', () => {
    expect(employees).toHaveLength(10_000)
  })

  it('makes the same people every time with the same seed', () => {
    const again = generateEmployees({ count: 10_000, seed: 42 })
    expect(again[0]).toEqual(employees[0])
    expect(again[9_999]).toEqual(employees[9_999])
  })

  it('makes different people with a different seed', () => {
    const other = generateEmployees({ count: 10_000, seed: 7 })
    expect(other[0]).not.toEqual(employees[0])
  })

  it('follows the exact country mix from the spec', () => {
    const counts = Object.fromEntries(COUNTRIES.map((country) => [country.code, 0]))
    for (const employee of employees) counts[employee.country] = (counts[employee.country] ?? 0) + 1
    expect(counts).toEqual({
      IN: 3500,
      US: 2000,
      GB: 1000,
      DE: 1000,
      CA: 800,
      AU: 700,
      SG: 500,
      BR: 500,
    })
  })

  it('pays everyone in the currency of their country', () => {
    const mismatched = employees.filter(
      (employee) => employee.currency !== currencyForCountry(employee.country),
    )
    expect(mismatched).toEqual([])
  })

  it('gives everyone a different email', () => {
    expect(new Set(employees.map((employee) => employee.email)).size).toBe(10_000)
  })

  it('makes only employees the api would accept', () => {
    const rejected = employees.filter(
      (employee) => !createEmployeeSchema.safeParse(employee).success,
    )
    expect(rejected).toEqual([])
  })

  it('rounds every salary to 1,000', () => {
    expect(employees.every((employee) => employee.annualSalary % 1000 === 0)).toBe(true)
  })

  it('keeps hire dates between 2010-01-01 and 2026-10-31', () => {
    const outside = employees.filter(
      (employee) => employee.hireDate < '2010-01-01' || employee.hireDate > '2026-10-31',
    )
    expect(outside).toEqual([])
  })

  it('pays a staff engineer more than a software engineer in the same country, on average', () => {
    const average = (jobTitle: string) => {
      const salaries = employees
        .filter((employee) => employee.country === 'IN' && employee.jobTitle === jobTitle)
        .map((employee) => employee.annualSalary)
      return salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length
    }
    expect(average('Staff Engineer')).toBeGreaterThan(average('Software Engineer'))
  })
})
