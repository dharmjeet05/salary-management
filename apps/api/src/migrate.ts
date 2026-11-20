import { fileURLToPath } from 'node:url'
import { migrateDatabase } from '@salary/db'
import { loadEnv } from './config/env'

// The build copies packages/db/migrations next to the bundle, so this only
// works from dist. Locally, `pnpm db:migrate` does the same with drizzle-kit.
const migrationsFolder = fileURLToPath(new URL('./migrations', import.meta.url))

await migrateDatabase(loadEnv().databaseUrl, migrationsFolder)
console.log('Migrations are up to date')
