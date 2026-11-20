import { createTestDb, resetDb, type TestDb } from '@salary/db/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { employeeRow } from '../test/fixtures'
import { createEmployeeRepository } from './employee-repository'
import { createInsightsRepository, type InsightsRepository } from './insights-repository'

// Ten people, numbers small enough to check by hand.
//
// India (INR), 7 people:
//   Software Engineer         700,000  1,000,000  1,200,000  1,400,000
//   Senior Software Engineer  2,000,000  2,400,000
//   Sales Manager (Sales)     1,500,000
// United Kingdom (GBP), 3 people:
//   Software Engineer         60,000  70,000  80,000
const india = [
  { jobTitle: 'Software Engineer', annualSalary: 700_000 },
  { jobTitle: 'Software Engineer', annualSalary: 1_000_000 },
  { jobTitle: 'Software Engineer', annualSalary: 1_200_000 },
  { jobTitle: 'Software Engineer', annualSalary: 1_400_000 },
  { jobTitle: 'Senior Software Engineer', annualSalary: 2_000_000 },
  { jobTitle: 'Senior Software Engineer', annualSalary: 2_400_000 },
] as const
const uk = [60_000, 70_000, 80_000]

let testDb: TestDb
let insights: InsightsRepository

beforeAll(async () => {
  testDb = await createTestDb()
  insights = createInsightsRepository(testDb.db)
})

afterAll(async () => {
  await testDb.close()
})

beforeEach(async () => {
  await resetDb(testDb.db)
  const employees = createEmployeeRepository(testDb.db)
  let n = 0
  for (const person of india) {
    n++
    await employees.insert(employeeRow({ ...person, email: `in.${String(n)}@acme.test` }))
  }
  await employees.insert(
    employeeRow({
      email: 'in.sales@acme.test',
      department: 'Sales',
      jobTitle: 'Sales Manager',
      annualSalary: 1_500_000,
    }),
  )
  for (const annualSalary of uk) {
    n++
    await employees.insert(
      employeeRow({
        email: `gb.${String(n)}@acme.test`,
        country: 'GB',
        currency: 'GBP',
        annualSalary,
      }),
    )
  }
})

describe('pay per country', () => {
  it('gives headcount, min, max, average and median for each country, biggest first', async () => {
    expect(await insights.countryStats()).toEqual([
      {
        country: 'IN',
        currency: 'INR',
        headcount: 7,
        minSalary: 700_000,
        maxSalary: 2_400_000,
        // 10,200,000 / 7 = 1,457,142.86, rounded
        averageSalary: 1_457_143,
        // 700k 1.0m 1.2m [1.4m] 1.5m 2.0m 2.4m
        medianSalary: 1_400_000,
      },
      {
        country: 'GB',
        currency: 'GBP',
        headcount: 3,
        minSalary: 60_000,
        maxSalary: 80_000,
        averageSalary: 70_000,
        medianSalary: 70_000,
      },
    ])
  })

  it('leaves out countries with nobody in them', async () => {
    const countries = (await insights.countryStats()).map((row) => row.country)
    expect(countries).not.toContain('US')
  })
})

describe('pay per job title in a country', () => {
  it('groups by department and job title, in that order', async () => {
    const rows = await insights.jobTitleStats('IN')
    expect(rows.map((row) => `${row.department} / ${row.jobTitle}`)).toEqual([
      'Engineering / Senior Software Engineer',
      'Engineering / Software Engineer',
      'Sales / Sales Manager',
    ])
  })

  it('takes the middle of the two middle salaries for an even group', async () => {
    const rows = await insights.jobTitleStats('IN')
    const engineers = rows.find((row) => row.jobTitle === 'Software Engineer')
    // 700k [1.0m 1.2m] 1.4m -> 1.1m
    expect(engineers).toMatchObject({
      headcount: 4,
      medianSalary: 1_100_000,
      averageSalary: 1_075_000,
    })
  })

  it('reports a one person group as that person', async () => {
    const rows = await insights.jobTitleStats('IN')
    expect(rows.find((row) => row.jobTitle === 'Sales Manager')).toEqual({
      department: 'Sales',
      jobTitle: 'Sales Manager',
      headcount: 1,
      minSalary: 1_500_000,
      maxSalary: 1_500_000,
      averageSalary: 1_500_000,
      medianSalary: 1_500_000,
    })
  })

  it('returns nothing for a country with nobody in it', async () => {
    expect(await insights.jobTitleStats('US')).toEqual([])
  })
})

describe('cost per department in a country', () => {
  it('adds up salaries per department, biggest total first', async () => {
    expect(await insights.departmentStats('IN')).toEqual([
      // 0.7 + 1.0 + 1.2 + 1.4 + 2.0 + 2.4 = 8.7m
      { department: 'Engineering', headcount: 6, totalSalary: 8_700_000 },
      { department: 'Sales', headcount: 1, totalSalary: 1_500_000 },
    ])
  })
})

describe('underpaid people in a country', () => {
  it('finds people under 80% of the median for their job title', async () => {
    // software engineer median is 1.1m, 80% is 880k, so only the 700k one
    expect(await insights.underpaid('IN', 0.8)).toEqual([
      expect.objectContaining({
        fullName: 'Asha Patel',
        jobTitle: 'Software Engineer',
        annualSalary: 700_000,
        medianSalary: 1_100_000,
        // 700 / 1100 = 63.6%
        percentOfMedian: 64,
      }),
    ])
  })

  it('uses the threshold it is given, lowest share first and then by id', async () => {
    // at 95%: 700k (64%), then 1.0m and 2.0m tie at 91%, so id decides
    const rows = await insights.underpaid('IN', 0.95)
    expect(rows.map((row) => [row.annualSalary, row.percentOfMedian])).toEqual([
      [700_000, 64],
      [1_000_000, 91],
      [2_000_000, 91],
    ])
  })

  it('never compares people with a different job title', async () => {
    const rows = await insights.underpaid('IN', 0.8)
    expect(rows.map((row) => row.jobTitle)).not.toContain('Senior Software Engineer')
  })

  it('returns nothing for a country with nobody in it', async () => {
    expect(await insights.underpaid('US', 0.8)).toEqual([])
  })
})
