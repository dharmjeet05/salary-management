import { createDb } from '../client'
import { generateEmployees } from './generate-employees'
import { seedEmployees } from './seed-employees'

export const DEMO_EMPLOYEE_COUNT = 10_000
const DEMO_SEED = 42

// Replaces every employee with the same 10,000 people on every run
export async function seedDemoDatabase(databaseUrl: string) {
  const { db, close } = createDb(databaseUrl)
  try {
    await seedEmployees(db, generateEmployees({ count: DEMO_EMPLOYEE_COUNT, seed: DEMO_SEED }))
  } finally {
    // without this the open pool keeps the process alive after the seed
    await close()
  }
}
