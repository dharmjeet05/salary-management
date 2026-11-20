import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { employees, type NewEmployeeRow } from './schema'
import { createTestDb, resetDb, type TestDb } from './testing'

const asha: NewEmployeeRow = {
  fullName: 'Asha Patel',
  email: 'asha.patel@acme.test',
  country: 'IN',
  currency: 'INR',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  annualSalary: 1800000,
  hireDate: '2022-04-11',
}

let testDb: TestDb

beforeAll(async () => {
  testDb = await createTestDb()
})

afterAll(async () => {
  await testDb.close()
})

beforeEach(async () => {
  await resetDb(testDb.db)
})

describe('employees table', () => {
  it('fills in the id and both timestamps on insert', async () => {
    const [row] = await testDb.db.insert(employees).values(asha).returning()
    expect(row).toMatchObject({ id: 1, fullName: 'Asha Patel' })
    expect(row?.createdAt).toBeInstanceOf(Date)
    expect(row?.updatedAt).toBeInstanceOf(Date)
  })

  it('keeps the hire date exactly as written', async () => {
    const [row] = await testDb.db.insert(employees).values(asha).returning()
    expect(row?.hireDate).toBe('2022-04-11')
  })

  it('refuses a second employee with the same email', async () => {
    await testDb.db.insert(employees).values(asha)
    const duplicate = testDb.db.insert(employees).values({ ...asha, fullName: 'Asha P.' })
    await expect(duplicate).rejects.toMatchObject({ cause: { code: '23505' } })
  })

  it('refuses a salary of 0', async () => {
    const zeroSalary = testDb.db.insert(employees).values({ ...asha, annualSalary: 0 })
    await expect(zeroSalary).rejects.toMatchObject({ cause: { code: '23514' } })
  })
})

describe('test database helper', () => {
  it('empties the table and starts ids at 1 again on reset', async () => {
    await testDb.db.insert(employees).values(asha)
    await resetDb(testDb.db)
    const [row] = await testDb.db.insert(employees).values(asha).returning()
    expect(row?.id).toBe(1)
  })

  it('gives each test database its own data', async () => {
    const other = await createTestDb()
    await testDb.db.insert(employees).values(asha)
    const rowsInOther = await other.db.select().from(employees)
    await other.close()
    expect(rowsInOther).toEqual([])
  })
})
