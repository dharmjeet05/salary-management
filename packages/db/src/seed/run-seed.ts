import { createDb } from '../client'
import { generateEmployees } from './generate-employees'
import { seedEmployees } from './seed-employees'

const SEED = 42
const COUNT = 10_000

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set. Add it to packages/db/.env')

const started = performance.now()
const { db, close } = createDb(databaseUrl)
try {
  await seedEmployees(db, generateEmployees({ count: COUNT, seed: SEED }))
  const seconds = ((performance.now() - started) / 1000).toFixed(1)
  console.log(`Seeded ${COUNT.toLocaleString('en')} employees in ${seconds}s`)
} finally {
  // without this the open pool keeps the process alive after the seed
  await close()
}
