import { employees, type Database, type EmployeeRow, type NewEmployeeRow } from '@salary/db'
import type { EmployeeListQuery, SortField } from '@salary/shared'
import { and, asc, count, desc, eq, ilike, or, sql, type AnyColumn, type SQL } from 'drizzle-orm'
import { EmailTakenError } from '../errors/domain-errors'
import { isUniqueViolation } from './database-errors'

export type EmployeeChanges = Partial<Omit<NewEmployeeRow, 'id' | 'createdAt' | 'updatedAt'>>

const sortColumns: Record<SortField, AnyColumn | SQL> = {
  fullName: sql`lower(${employees.fullName})`,
  annualSalary: employees.annualSalary,
  hireDate: employees.hireDate,
}

// The search is a plain "contains" match, so LIKE's own wildcards and its
// escape character must not keep their special meaning.
function containsPattern(search: string) {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
}

function listFilter(query: EmployeeListQuery) {
  const pattern = query.search === undefined ? undefined : containsPattern(query.search)
  return and(
    query.country === undefined ? undefined : eq(employees.country, query.country),
    query.department === undefined ? undefined : eq(employees.department, query.department),
    query.jobTitle === undefined ? undefined : eq(employees.jobTitle, query.jobTitle),
    pattern === undefined
      ? undefined
      : or(ilike(employees.fullName, pattern), ilike(employees.email, pattern)),
  )
}

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

    async list(query: EmployeeListQuery): Promise<{ rows: EmployeeRow[]; total: number }> {
      const where = listFilter(query)
      const direction = query.sortOrder === 'asc' ? asc : desc
      const [rows, counts] = await Promise.all([
        db
          .select()
          .from(employees)
          .where(where)
          // id last, so equal salaries or dates keep one order across pages
          .orderBy(direction(sortColumns[query.sortBy]), asc(employees.id))
          .limit(query.pageSize)
          .offset((query.page - 1) * query.pageSize),
        db.select({ total: count() }).from(employees).where(where),
      ])
      const [counted] = counts
      if (!counted) throw new Error('Count query on employees returned no row')
      return { rows, total: counted.total }
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
