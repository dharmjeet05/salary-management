import { createTestDb, resetDb, type TestDb } from '@salary/db/testing'
import {
  countryInsightsResponseSchema,
  departmentInsightsResponseSchema,
  jobTitleInsightsResponseSchema,
  underpaidResponseSchema,
} from '@salary/shared'
import type { Express } from 'express'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { createEmployeeRepository } from '../repositories/employee-repository'
import { employeeRow } from '../test/fixtures'

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
  const employees = createEmployeeRepository(testDb.db)
  await employees.insert(employeeRow({ email: 'a@acme.test', annualSalary: 700_000 }))
  await employees.insert(employeeRow({ email: 'b@acme.test', annualSalary: 1_000_000 }))
  await employees.insert(employeeRow({ email: 'c@acme.test', annualSalary: 1_200_000 }))
})

describe('GET /api/insights/countries', () => {
  it('answers with stats per country in the shared shape', async () => {
    const response = await request(app).get('/api/insights/countries')
    expect(response.status).toBe(200)
    const { countries } = countryInsightsResponseSchema.parse(response.body)
    expect(countries).toEqual([expect.objectContaining({ country: 'IN', headcount: 3 })])
  })
})

describe('GET /api/insights/countries/:country/job-titles', () => {
  it('answers with the currency of the country', async () => {
    const response = await request(app).get('/api/insights/countries/IN/job-titles')
    expect(jobTitleInsightsResponseSchema.parse(response.body)).toMatchObject({
      country: 'IN',
      currency: 'INR',
    })
  })

  it('answers 400 for a country that is not supported', async () => {
    const response = await request(app).get('/api/insights/countries/FR/job-titles')
    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({ error: { details: [{ path: 'country' }] } })
  })

  it('answers with an empty list and the currency for a country with nobody in it', async () => {
    const response = await request(app).get('/api/insights/countries/US/job-titles')
    expect(jobTitleInsightsResponseSchema.parse(response.body)).toEqual({
      country: 'US',
      currency: 'USD',
      jobTitles: [],
    })
  })
})

describe('GET /api/insights/countries/:country/departments', () => {
  it('answers with the total per department', async () => {
    const response = await request(app).get('/api/insights/countries/IN/departments')
    expect(departmentInsightsResponseSchema.parse(response.body).departments).toEqual([
      { department: 'Engineering', headcount: 3, totalSalary: 2_900_000 },
    ])
  })
})

describe('GET /api/insights/countries/:country/underpaid', () => {
  it('uses 80% of the median when no threshold is sent', async () => {
    const response = await request(app).get('/api/insights/countries/IN/underpaid')
    const body = underpaidResponseSchema.parse(response.body)
    // median 1.0m, 80% is 800k, so the 700k one
    expect(body.threshold).toBe(0.8)
    expect(body.employees.map((row) => row.annualSalary)).toEqual([700_000])
  })

  it('reads the threshold from the query string', async () => {
    const response = await request(app).get('/api/insights/countries/IN/underpaid?threshold=0.5')
    expect(underpaidResponseSchema.parse(response.body).employees).toEqual([])
  })

  it('answers 400 for a threshold above 1', async () => {
    const response = await request(app).get('/api/insights/countries/IN/underpaid?threshold=1.5')
    expect(response.status).toBe(400)
  })
})
