import { employees, type Database } from '@salary/db'
import type { CountryCode } from '@salary/shared'
import { and, asc, desc, eq, sql } from 'drizzle-orm'

const salary = employees.annualSalary
const headcount = sql<number>`count(*)`.mapWith(Number)

// Postgres does the maths. Big integers and numerics come back as strings
// from the driver, so every aggregate maps to a number on purpose.
const salaryStats = {
  headcount,
  minSalary: sql<number>`min(${salary})`.mapWith(Number),
  maxSalary: sql<number>`max(${salary})`.mapWith(Number),
  averageSalary: sql<number>`round(avg(${salary}))`.mapWith(Number),
  medianSalary:
    sql<number>`round((percentile_cont(0.5) within group (order by ${salary}))::numeric)`.mapWith(
      Number,
    ),
}

export function createInsightsRepository(db: Database) {
  return {
    countryStats() {
      return db
        .select({ country: employees.country, currency: employees.currency, ...salaryStats })
        .from(employees)
        .groupBy(employees.country, employees.currency)
        .orderBy(desc(headcount), asc(employees.country))
    },

    jobTitleStats(country: CountryCode) {
      return db
        .select({ department: employees.department, jobTitle: employees.jobTitle, ...salaryStats })
        .from(employees)
        .where(eq(employees.country, country))
        .groupBy(employees.department, employees.jobTitle)
        .orderBy(asc(employees.department), asc(employees.jobTitle))
    },

    departmentStats(country: CountryCode) {
      const totalSalary = sql<number>`sum(${salary})`.mapWith(Number)
      return db
        .select({ department: employees.department, headcount, totalSalary })
        .from(employees)
        .where(eq(employees.country, country))
        .groupBy(employees.department)
        .orderBy(desc(totalSalary), asc(employees.department))
    },

    underpaid(country: CountryCode, threshold: number) {
      const medians = db.$with('medians').as(
        db
          .select({
            jobTitle: employees.jobTitle,
            median: sql<number>`percentile_cont(0.5) within group (order by ${salary})`.as(
              'median',
            ),
          })
          .from(employees)
          .where(eq(employees.country, country))
          .groupBy(employees.jobTitle),
      )
      const percentOfMedian =
        sql<number>`round((${salary} * 100 / ${medians.median})::numeric)`.mapWith(Number)
      return db
        .with(medians)
        .select({
          id: employees.id,
          fullName: employees.fullName,
          department: employees.department,
          jobTitle: employees.jobTitle,
          annualSalary: salary,
          medianSalary: sql<number>`round(${medians.median}::numeric)`.mapWith(Number),
          percentOfMedian,
        })
        .from(employees)
        .innerJoin(medians, eq(medians.jobTitle, employees.jobTitle))
        .where(
          and(eq(employees.country, country), sql`${salary} < ${threshold} * ${medians.median}`),
        )
        .orderBy(asc(percentOfMedian), asc(employees.id))
    },
  }
}

export type InsightsRepository = ReturnType<typeof createInsightsRepository>
