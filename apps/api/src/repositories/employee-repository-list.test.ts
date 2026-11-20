import { createTestDb, resetDb, type TestDb } from '@salary/db/testing'
import { employeeListQuerySchema } from '@salary/shared'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { employeeRow } from '../test/fixtures'
import { createEmployeeRepository, type EmployeeRepository } from './employee-repository'

// Six people, small enough to check every expected result by eye.
// "emma Brown" starts lower case on purpose, to test the name sort.
const people = [
  employeeRow({
    fullName: 'Asha Patel',
    email: 'asha.patel@acme.test',
    country: 'IN',
    currency: 'INR',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    annualSalary: 1_800_000,
    hireDate: '2022-04-11',
  }),
  employeeRow({
    fullName: 'Ravi Kumar',
    email: 'ravi.kumar@acme.test',
    country: 'IN',
    currency: 'INR',
    department: 'Sales',
    jobTitle: 'Sales Manager',
    annualSalary: 2_500_000,
    hireDate: '2019-01-15',
  }),
  employeeRow({
    fullName: 'emma Brown',
    email: 'emma.brown@acme.test',
    country: 'GB',
    currency: 'GBP',
    department: 'Engineering',
    jobTitle: 'Senior Software Engineer',
    annualSalary: 85_000,
    hireDate: '2021-06-01',
  }),
  employeeRow({
    fullName: 'Liam Smith',
    email: 'liam.smith@acme.test',
    country: 'US',
    currency: 'USD',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    annualSalary: 120_000,
    hireDate: '2023-09-20',
  }),
  employeeRow({
    fullName: 'Noah Mueller',
    email: 'noah.mueller@acme.test',
    country: 'DE',
    currency: 'EUR',
    department: 'Product',
    jobTitle: 'Product Manager',
    annualSalary: 90_000,
    hireDate: '2020-03-02',
  }),
  employeeRow({
    fullName: 'Priya Shah',
    email: 'priya.shah@acme.test',
    country: 'IN',
    currency: 'INR',
    department: 'Engineering',
    jobTitle: 'Senior Software Engineer',
    annualSalary: 3_200_000,
    hireDate: '2018-07-30',
  }),
]

let testDb: TestDb
let repository: EmployeeRepository

beforeAll(async () => {
  testDb = await createTestDb()
  repository = createEmployeeRepository(testDb.db)
})

afterAll(async () => {
  await testDb.close()
})

beforeEach(async () => {
  await resetDb(testDb.db)
})

async function listNames(query: Record<string, unknown>) {
  const { rows } = await repository.list(employeeListQuerySchema.parse(query))
  return rows.map((row) => row.fullName)
}

describe('listing employees', () => {
  beforeEach(async () => {
    for (const person of people) await repository.insert(person)
  })

  it('counts everyone who matches', async () => {
    const { total } = await repository.list(employeeListQuerySchema.parse({}))
    expect(total).toBe(6)
  })

  it('sorts by name A to Z by default, ignoring upper and lower case', async () => {
    expect(await listNames({})).toEqual([
      'Asha Patel',
      'emma Brown',
      'Liam Smith',
      'Noah Mueller',
      'Priya Shah',
      'Ravi Kumar',
    ])
  })

  it('sorts by name Z to A', async () => {
    expect((await listNames({ sortOrder: 'desc' }))[0]).toBe('Ravi Kumar')
  })

  it('sorts by salary, highest first', async () => {
    expect(await listNames({ sortBy: 'annualSalary', sortOrder: 'desc' })).toEqual([
      'Priya Shah',
      'Ravi Kumar',
      'Asha Patel',
      'Liam Smith',
      'Noah Mueller',
      'emma Brown',
    ])
  })

  it('sorts by hire date, longest serving first', async () => {
    expect(await listNames({ sortBy: 'hireDate' })).toEqual([
      'Priya Shah',
      'Ravi Kumar',
      'Noah Mueller',
      'emma Brown',
      'Asha Patel',
      'Liam Smith',
    ])
  })

  it('finds people by part of their name, ignoring case', async () => {
    expect(await listNames({ search: 'PATEL' })).toEqual(['Asha Patel'])
  })

  it('finds people by part of their email', async () => {
    expect(await listNames({ search: 'ravi.k' })).toEqual(['Ravi Kumar'])
  })

  it('treats % in the search as a normal character', async () => {
    expect(await listNames({ search: '%a' })).toEqual([])
  })

  it('treats _ in the search as a normal character', async () => {
    expect(await listNames({ search: 'a_' })).toEqual([])
  })

  it('filters by country', async () => {
    expect(await listNames({ country: 'IN' })).toEqual(['Asha Patel', 'Priya Shah', 'Ravi Kumar'])
  })

  it('filters by job title', async () => {
    expect(await listNames({ jobTitle: 'Senior Software Engineer' })).toEqual([
      'emma Brown',
      'Priya Shah',
    ])
  })

  it('combines filters', async () => {
    expect(await listNames({ country: 'IN', department: 'Engineering' })).toEqual([
      'Asha Patel',
      'Priya Shah',
    ])
  })

  it('combines a filter with a search', async () => {
    expect(await listNames({ country: 'IN', search: 'shah' })).toEqual(['Priya Shah'])
  })

  it('counts only the people who match the filters', async () => {
    const { total } = await repository.list(employeeListQuerySchema.parse({ country: 'IN' }))
    expect(total).toBe(3)
  })

  it('returns no rows but the real total for a page past the end', async () => {
    const result = await repository.list(employeeListQuerySchema.parse({ page: 2, pageSize: 10 }))
    expect(result).toEqual({ rows: [], total: 6 })
  })
})

describe('paging through many employees', () => {
  // Twelve people with the same salary: only the id can keep their order
  // stable across pages.
  beforeEach(async () => {
    for (let n = 1; n <= 12; n++) {
      await repository.insert(
        employeeRow({ fullName: `Person ${String(n)}`, email: `person.${String(n)}@acme.test` }),
      )
    }
  })

  it('returns the second page', async () => {
    const { rows } = await repository.list(
      employeeListQuerySchema.parse({ page: 2, pageSize: 10, sortBy: 'hireDate' }),
    )
    expect(rows.map((row) => row.id)).toEqual([11, 12])
  })

  it('never shows someone on two pages when salaries are equal', async () => {
    const query = { pageSize: 10, sortBy: 'annualSalary' }
    const first = await repository.list(employeeListQuerySchema.parse({ ...query, page: 1 }))
    const second = await repository.list(employeeListQuerySchema.parse({ ...query, page: 2 }))
    const ids = [...first.rows, ...second.rows].map((row) => row.id)
    expect(new Set(ids).size).toBe(12)
  })
})
