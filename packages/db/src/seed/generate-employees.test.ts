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

  it('gives everyone a different full name', () => {
    expect(new Set(employees.map((employee) => employee.fullName)).size).toBe(10_000)
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

  it('puts some people well under the median of their country and job title', () => {
    const groups = new Map<string, number[]>()
    for (const employee of employees) {
      const key = `${employee.country} ${employee.jobTitle}`
      groups.set(key, [...(groups.get(key) ?? []), employee.annualSalary])
    }
    let underpaid = 0
    for (const salaries of groups.values()) {
      const sorted = [...salaries].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)] ?? 0
      underpaid += salaries.filter((salary) => salary < 0.8 * median).length
    }
    // about 3% of 10,000 by design, with room for the random draw
    expect(underpaid).toBeGreaterThan(200)
  })

  it('pays a software engineer in india between 15 and 30 lakh rupees on the median', () => {
    const salaries = employees
      .filter((employee) => employee.country === 'IN' && employee.jobTitle === 'Software Engineer')
      .map((employee) => employee.annualSalary)
      .sort((a, b) => a - b)
    const median = salaries[Math.floor(salaries.length / 2)] ?? 0
    expect(median).toBeGreaterThan(1_500_000)
    expect(median).toBeLessThan(3_000_000)
  })
})
