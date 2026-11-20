import { createTestDb, resetDb, type TestDb } from '@salary/db/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { EmailTakenError } from '../errors/domain-errors'
import { employeeRow } from '../test/fixtures'
import { createEmployeeRepository, type EmployeeRepository } from './employee-repository'

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

describe('employee repository', () => {
  it('inserts an employee and returns the stored row', async () => {
    const row = await repository.insert(employeeRow())
    expect(row).toMatchObject({ id: 1, email: 'asha.patel@acme.test', currency: 'INR' })
  })

  it('finds an employee by id', async () => {
    const { id } = await repository.insert(employeeRow())
    expect(await repository.findById(id)).toMatchObject({ id, fullName: 'Asha Patel' })
  })

  it('returns null for an id that does not exist', async () => {
    expect(await repository.findById(999)).toBeNull()
  })

  it('throws EmailTakenError when the email is already used', async () => {
    await repository.insert(employeeRow())
    await expect(repository.insert(employeeRow({ fullName: 'Asha P.' }))).rejects.toBeInstanceOf(
      EmailTakenError,
    )
  })

  it('changes only the fields it is given', async () => {
    const { id } = await repository.insert(employeeRow())
    const updated = await repository.update(id, { annualSalary: 2000000 })
    expect(updated).toMatchObject({ annualSalary: 2000000, fullName: 'Asha Patel' })
  })

  it('moves updatedAt forward on update', async () => {
    const created = await repository.insert(employeeRow())
    const updated = await repository.update(created.id, { annualSalary: 2000000 })
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime())
  })

  it('returns null when updating an id that does not exist', async () => {
    expect(await repository.update(999, { annualSalary: 2000000 })).toBeNull()
  })

  it("throws EmailTakenError when an update takes another employee's email", async () => {
    await repository.insert(employeeRow())
    const { id } = await repository.insert(employeeRow({ email: 'ravi.kumar@acme.test' }))
    await expect(repository.update(id, { email: 'asha.patel@acme.test' })).rejects.toBeInstanceOf(
      EmailTakenError,
    )
  })

  it('removes the employee on delete', async () => {
    const { id } = await repository.insert(employeeRow())
    await repository.delete(id)
    expect(await repository.findById(id)).toBeNull()
  })

  it('says it deleted something', async () => {
    const { id } = await repository.insert(employeeRow())
    expect(await repository.delete(id)).toBe(true)
  })

  it('says so when there was nothing to delete', async () => {
    expect(await repository.delete(999)).toBe(false)
  })
})
