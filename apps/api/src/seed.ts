import { DEMO_EMPLOYEE_COUNT, seedDemoDatabase } from '@salary/db'
import { loadEnv } from './config/env'

// The image has no tsx, so the server runs the seed from the bundle:
// docker exec salary-management node dist/seed.js
await seedDemoDatabase(loadEnv().databaseUrl)
console.log(`Seeded ${DEMO_EMPLOYEE_COUNT.toLocaleString('en')} employees`)
