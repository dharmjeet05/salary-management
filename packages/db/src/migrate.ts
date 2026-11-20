import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

// Runs the migrations the database has not seen yet, each in the order
// drizzle-kit generated them. Throws on the first one that fails.
export async function migrateDatabase(databaseUrl: string, migrationsFolder: string) {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 })
  try {
    await migrate(drizzle(pool), { migrationsFolder })
  } finally {
    await pool.end()
  }
}
