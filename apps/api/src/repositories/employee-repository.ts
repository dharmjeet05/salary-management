import { employees, type Database, type EmployeeRow, type NewEmployeeRow } from '@salary/db'
import { eq } from 'drizzle-orm'
import { EmailTakenError } from '../errors/domain-errors'
import { isUniqueViolation } from './database-errors'

export type EmployeeChanges = Partial<Omit<NewEmployeeRow, 'id' | 'createdAt' | 'updatedAt'>>

function rethrowEmailTaken(error: unknown): never {
  if (isUniqueViolation(error, 'employees_email_unique')) throw new EmailTakenError()
  throw error
}

export function createEmployeeRepository(db: Database) {
  return {
    async findById(id: number): Promise<EmployeeRow | null> {
      const [row] = await db.select().from(employees).where(eq(employees.id, id))
      return row ?? null
    },

    async insert(values: NewEmployeeRow): Promise<EmployeeRow> {
      const [row] = await db.insert(employees).values(values).returning().catch(rethrowEmailTaken)
      if (!row) throw new Error('Insert into employees returned no row')
      return row
    },

    async update(id: number, changes: EmployeeChanges): Promise<EmployeeRow | null> {
      const [row] = await db
        .update(employees)
        .set(changes)
        .where(eq(employees.id, id))
        .returning()
        .catch(rethrowEmailTaken)
      return row ?? null
    },

    async delete(id: number): Promise<boolean> {
      const deleted = await db
        .delete(employees)
        .where(eq(employees.id, id))
        .returning({ id: employees.id })
      return deleted.length > 0
    },
  }
}

export type EmployeeRepository = ReturnType<typeof createEmployeeRepository>
