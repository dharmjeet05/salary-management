import { createTestDb, resetDb, type TestDb } from '@salary/db/testing'
import type { Express } from 'express'
import request from 'supertest'
import { employeeListResponseSchema, employeeSchema, metaResponseSchema } from '@salary/shared'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { employeeInput } from '../test/fixtures'

let testDb: TestDb
let app: Express

beforeAll(async () => {
  testDb = await createTestDb()
  app = createApp({ corsOrigin: 'http://localhost:3000', db: testDb.db })
})

afterAll(async () => {
  await testDb.close()
})

beforeEach(async () => {
  await resetDb(testDb.db)
})

async function addEmployee(overrides: Parameters<typeof employeeInput>[0] = {}) {
  const response = await request(app).post('/api/employees').send(employeeInput(overrides))
  return employeeSchema.parse(response.body)
}

describe('GET /api/meta', () => {
  it('lists every country with its currency', async () => {
    const response = await request(app).get('/api/meta')
    const { countries } = metaResponseSchema.parse(response.body)
    expect(countries).toContainEqual({ code: 'IN', name: 'India', currency: 'INR' })
  })

  it('lists every department with its job titles', async () => {
    const response = await request(app).get('/api/meta')
    const { departments } = metaResponseSchema.parse(response.body)
    expect(departments).toContainEqual({
      name: 'Product',
      jobTitles: ['Product Manager', 'Senior Product Manager'],
    })
  })
})

describe('POST /api/employees', () => {
  it('adds an employee and answers 201 with the currency set from the country', async () => {
    const response = await request(app).post('/api/employees').send(employeeInput())
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ id: 1, fullName: 'Asha Patel', currency: 'INR' })
  })

  it('ignores a currency sent by the client', async () => {
    const response = await request(app)
      .post('/api/employees')
      .send({ ...employeeInput({ country: 'DE' }), currency: 'INR' })
    expect(response.body).toMatchObject({ currency: 'EUR' })
  })

  it('answers 400 with a detail per field for invalid input', async () => {
    const response = await request(app)
      .post('/api/employees')
      .send(employeeInput({ email: 'asha.patel' }))
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ path: 'email', message: 'Enter a valid email' }],
      },
    })
  })

  it('answers 409 when the email is already used', async () => {
    await addEmployee()
    const response = await request(app)
      .post('/api/employees')
      .send(employeeInput({ fullName: 'Asha P.' }))
    expect(response.status).toBe(409)
    expect(response.body).toMatchObject({ error: { code: 'EMAIL_TAKEN' } })
  })
})

describe('GET /api/employees/:id', () => {
  it('answers with the employee', async () => {
    const { id } = await addEmployee()
    const response = await request(app).get(`/api/employees/${String(id)}`)
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ id, email: 'asha.patel@acme.test' })
  })

  it('answers 404 for an id that does not exist', async () => {
    const response = await request(app).get('/api/employees/999')
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Employee not found' } })
  })

  it('answers 400 for an id that is not a number', async () => {
    const response = await request(app).get('/api/employees/abc')
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({ error: { details: [{ path: 'id' }] } })
  })
})

describe('GET /api/employees', () => {
  it('answers with the page, the page size and the total', async () => {
    await addEmployee()
    await addEmployee({ fullName: 'Ravi Kumar', email: 'ravi.kumar@acme.test' })
    const response = await request(app).get('/api/employees?pageSize=10')
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ page: 1, pageSize: 10, total: 2 })
  })

  it('reads search and filters from the query string', async () => {
    await addEmployee()
    await addEmployee({ fullName: 'Ravi Kumar', email: 'ravi.kumar@acme.test' })
    const response = await request(app).get('/api/employees?country=IN&search=ravi')
    const { data } = employeeListResponseSchema.parse(response.body)
    expect(data.map((row) => row.fullName)).toEqual(['Ravi Kumar'])
  })

  it('answers 400 for a page size that is not offered', async () => {
    const response = await request(app).get('/api/employees?pageSize=30')
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({ error: { details: [{ path: 'pageSize' }] } })
  })

  it('answers 400 for a salary sort without a country', async () => {
    const response = await request(app).get('/api/employees?sortBy=annualSalary')
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({ error: { details: [{ path: 'sortBy' }] } })
  })
})

describe('PATCH /api/employees/:id', () => {
  it('changes the given fields and answers with the employee', async () => {
    const { id } = await addEmployee()
    const response = await request(app)
      .patch(`/api/employees/${String(id)}`)
      .send({ annualSalary: 2000000 })
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ annualSalary: 2000000 })
  })

  it('answers 400 when no field is sent', async () => {
    const { id } = await addEmployee()
    const response = await request(app)
      .patch(`/api/employees/${String(id)}`)
      .send({})
    expect(response.status).toBe(400)
  })

  it('answers 400 on the job title field when it is not in the stored department', async () => {
    const { id } = await addEmployee()
    const response = await request(app)
      .patch(`/api/employees/${String(id)}`)
      .send({ jobTitle: 'Sales Manager' })
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({ error: { details: [{ path: 'jobTitle' }] } })
  })

  it('answers 404 for an id that does not exist', async () => {
    const response = await request(app).patch('/api/employees/999').send({ annualSalary: 1 })
    expect(response.status).toBe(404)
  })

  it("answers 409 when taking another employee's email", async () => {
    await addEmployee()
    const { id } = await addEmployee({ email: 'ravi.kumar@acme.test' })
    const response = await request(app)
      .patch(`/api/employees/${String(id)}`)
      .send({ email: 'asha.patel@acme.test' })
    expect(response.status).toBe(409)
  })
})

describe('DELETE /api/employees/:id', () => {
  it('answers 204 with no body', async () => {
    const { id } = await addEmployee()
    const response = await request(app).delete(`/api/employees/${String(id)}`)
    expect(response.status).toBe(204)
    expect(response.text).toBe('')
  })

  it('removes the employee', async () => {
    const { id } = await addEmployee()
    await request(app).delete(`/api/employees/${String(id)}`)
    const response = await request(app).get(`/api/employees/${String(id)}`)
    expect(response.status).toBe(404)
  })

  it('answers 404 for an id that does not exist', async () => {
    const response = await request(app).delete('/api/employees/999')
    expect(response.status).toBe(404)
  })
})
