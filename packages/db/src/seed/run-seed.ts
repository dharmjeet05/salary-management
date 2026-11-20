import { DEMO_EMPLOYEE_COUNT, seedDemoDatabase } from './seed-demo'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is not set. Add it to packages/db/.env')

const started = performance.now()
await seedDemoDatabase(databaseUrl)
const seconds = ((performance.now() - started) / 1000).toFixed(1)
console.log(`Seeded ${DEMO_EMPLOYEE_COUNT.toLocaleString('en')} employees in ${seconds}s`)
