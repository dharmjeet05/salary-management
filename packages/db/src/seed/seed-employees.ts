import { sql } from 'drizzle-orm'
import type { Database } from '../database'
import { employees, type NewEmployeeRow } from '../schema'

const BATCH_SIZE = 1000

// One transaction: if any batch fails, the truncate rolls back too and the
// old data stays.
export async function seedEmployees(db: Database, rows: NewEmployeeRow[]) {
  await db.transaction(async (tx) => {
    await tx.execute(sql`truncate table ${employees} restart identity`)
    for (let start = 0; start < rows.length; start += BATCH_SIZE) {
      await tx.insert(employees).values(rows.slice(start, start + BATCH_SIZE))
    }
  })
}
