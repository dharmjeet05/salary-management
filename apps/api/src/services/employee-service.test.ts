import { createTestDb, resetDb, type TestDb } from '@salary/db/testing'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailTakenError, NotFoundError, ValidationError } from '../errors/domain-errors'
import {
  createEmployeeRepository,
  type EmployeeRepository,
} from '../repositories/employee-repository'
import { employeeInput } from '../test/fixtures'
import { createEmployeeService, type EmployeeService } from './employee-service'

let testDb: TestDb
let repository: EmployeeRepository
let service: EmployeeService

beforeAll(async () => {
  testDb = await createTestDb()
  repository = createEmployeeRepository(testDb.db)
  service = createEmployeeService(repository)
})

afterAll(async () => {
  await testDb.close()
})

beforeEach(async () => {
  await resetDb(testDb.db)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('adding an employee', () => {
  it('sets the currency from the country', async () => {
    const employee = await service.create(employeeInput({ country: 'DE' }))
    expect(employee.currency).toBe('EUR')
  })

  it('returns the employee without the database timestamps', async () => {
    const employee = await service.create(employeeInput())
    expect(employee).toEqual({
      id: 1,
      fullName: 'Asha Patel',
      email: 'asha.patel@acme.test',
      country: 'IN',
      currency: 'INR',
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      annualSalary: 1800000,
      hireDate: '2022-04-11',
    })
  })

  it('refuses an email another employee already has', async () => {
    await service.create(employeeInput())
    await expect(service.create(employeeInput({ fullName: 'Asha P.' }))).rejects.toBeInstanceOf(
      EmailTakenError,
    )
  })
})

describe('looking up an employee', () => {
  it('finds an employee by id', async () => {
    const { id } = await service.create(employeeInput())
    expect(await service.getById(id)).toMatchObject({ id, fullName: 'Asha Patel' })
  })

  it('says not found for an id that does not exist', async () => {
    await expect(service.getById(999)).rejects.toBeInstanceOf(NotFoundError)
  })
})

describe('changing an employee', () => {
  it('changes the salary', async () => {
    const { id } = await service.create(employeeInput())
    const updated = await service.update(id, { annualSalary: 2000000 })
    expect(updated.annualSalary).toBe(2000000)
  })

  it('changes a salary with one query, without reading the row first', async () => {
    const { id } = await service.create(employeeInput())
    const findById = vi.spyOn(repository, 'findById')
    await service.update(id, { annualSalary: 2000000 })
    expect(findById).not.toHaveBeenCalled()
  })

  it('changes the currency when the country changes', async () => {
    const { id } = await service.create(employeeInput())
    const updated = await service.update(id, { country: 'GB' })
    expect(updated.currency).toBe('GBP')
  })

  it('accepts a new department and job title together', async () => {
    const { id } = await service.create(employeeInput())
    const updated = await service.update(id, { department: 'Sales', jobTitle: 'Sales Manager' })
    expect(updated).toMatchObject({ department: 'Sales', jobTitle: 'Sales Manager' })
  })

  it('accepts a new job title from the stored department', async () => {
    const { id } = await service.create(employeeInput())
    const updated = await service.update(id, { jobTitle: 'Senior Software Engineer' })
    expect(updated.jobTitle).toBe('Senior Software Engineer')
  })

  it('refuses a job title that is not in the stored department', async () => {
    const { id } = await service.create(employeeInput())
    await expect(service.update(id, { jobTitle: 'Sales Manager' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [{ path: 'jobTitle', message: 'Sales Manager is not a job title in Engineering' }],
    })
  })

  it('refuses a department that does not have the stored job title', async () => {
    const { id } = await service.create(employeeInput())
    await expect(service.update(id, { department: 'Sales' })).rejects.toBeInstanceOf(
      ValidationError,
    )
  })

  it('leaves the employee unchanged when the update is refused', async () => {
    const { id } = await service.create(employeeInput())
    await service.update(id, { department: 'Sales' }).catch(() => undefined)
    expect((await service.getById(id)).department).toBe('Engineering')
  })

  it("refuses another employee's email", async () => {
    await service.create(employeeInput())
    const { id } = await service.create(employeeInput({ email: 'ravi.kumar@acme.test' }))
    await expect(service.update(id, { email: 'asha.patel@acme.test' })).rejects.toBeInstanceOf(
      EmailTakenError,
    )
  })

  it('says not found for an id that does not exist', async () => {
    await expect(service.update(999, { annualSalary: 2000000 })).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })
})

describe('removing an employee', () => {
  it('removes the employee', async () => {
    const { id } = await service.create(employeeInput())
    await service.delete(id)
    await expect(service.getById(id)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('says not found for an id that does not exist', async () => {
    await expect(service.delete(999)).rejects.toBeInstanceOf(NotFoundError)
  })
})
