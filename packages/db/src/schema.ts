import type { CountryCode, Currency, Department, JobTitle } from '@salary/shared'
import { sql } from 'drizzle-orm'
import { char, check, date, index, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

export const employees = pgTable(
  'employees',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique('employees_email_unique'),
    country: char('country', { length: 2 }).$type<CountryCode>().notNull(),
    currency: char('currency', { length: 3 }).$type<Currency>().notNull(),
    department: varchar('department', { length: 50 }).$type<Department>().notNull(),
    jobTitle: varchar('job_title', { length: 80 }).$type<JobTitle>().notNull(),
    annualSalary: integer('annual_salary').notNull(),
    hireDate: date('hire_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check('employees_email_lower_case', sql`${table.email} = lower(${table.email})`),
    check('employees_annual_salary_positive', sql`${table.annualSalary} > 0`),
    index('employees_country_job_title_idx').on(table.country, table.jobTitle),
    index('employees_country_department_idx').on(table.country, table.department),
    index('employees_department_idx').on(table.department),
    index('employees_job_title_idx').on(table.jobTitle),
  ],
)

export type EmployeeRow = typeof employees.$inferSelect
export type NewEmployeeRow = typeof employees.$inferInsert
