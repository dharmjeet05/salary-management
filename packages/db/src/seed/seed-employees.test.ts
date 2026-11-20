import { count } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { employees } from '../schema'
import { createTestDb, type TestDb } from '../testing'
import { generateEmployees } from './generate-employees'
import { seedEmployees } from './seed-employees'

let testDb: TestDb

beforeAll(async () => {
  testDb = await createTestDb()
})

afterAll(async () => {
  await testDb.close()
})

async function rowCount() {
  const [row] = await testDb.db.select({ total: count() }).from(employees)
  return row?.total
}

describe('seeding the database', () => {
  const rows = generateEmployees({ count: 10_000, seed: 42 })

  it('stores all 10,000 employees', async () => {
    await seedEmployees(testDb.db, rows)
    expect(await rowCount()).toBe(10_000)
  })

  it('replaces the old data when it runs again, so it never doubles', async () => {
    await seedEmployees(testDb.db, rows)
    await seedEmployees(testDb.db, rows)
    expect(await rowCount()).toBe(10_000)
  })

  it('starts ids at 1 again on every run', async () => {
    await seedEmployees(testDb.db, rows)
    const [first] = await testDb.db
      .select({ id: employees.id })
      .from(employees)
      .orderBy(employees.id)
      .limit(1)
    expect(first?.id).toBe(1)
  })

  it('keeps the old data when a row in a later batch fails', async () => {
    await seedEmployees(testDb.db, rows)
    const [first, second] = rows
    if (!first || !second) throw new Error('Expected generated rows')
    // the duplicate email sits in the second batch, after 1,000 rows went in
    const broken = [...rows.slice(0, 1500), { ...first, email: second.email }]
    await expect(seedEmployees(testDb.db, broken)).rejects.toThrow()
    expect(await rowCount()).toBe(10_000)
  })
})
