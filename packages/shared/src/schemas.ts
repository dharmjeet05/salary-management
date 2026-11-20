import { z } from 'zod'
import {
  COUNTRY_CODES,
  CURRENCIES,
  DEPARTMENT_NAMES,
  JOB_TITLES,
  isJobTitleInDepartment,
  type Department,
  type JobTitle,
} from './domain'

export const PAGE_SIZES = [10, 25, 50, 100] as const
export const SORT_FIELDS = ['fullName', 'annualSalary', 'hireDate'] as const
export const SORT_ORDERS = ['asc', 'desc'] as const
export const MAX_ANNUAL_SALARY = 100_000_000
export const EARLIEST_HIRE_DATE = '1950-01-01'

// The date in the furthest ahead time zone (UTC+14). Anything up to it is
// today somewhere, so an HR manager in India is never told today is in the future.
const FURTHEST_AHEAD_OFFSET_MS = 14 * 60 * 60 * 1000

function latestAllowedHireDate() {
  return new Date(Date.now() + FURTHEST_AHEAD_OFFSET_MS).toISOString().slice(0, 10)
}

const countrySchema = z.enum(COUNTRY_CODES, { error: 'Pick a country from the list' })
const departmentSchema = z.enum(DEPARTMENT_NAMES, { error: 'Pick a department from the list' })
const jobTitleSchema = z.enum(JOB_TITLES, { error: 'Pick a job title from the list' })

const employeeFields = {
  fullName: z
    .string({ error: 'Enter a name' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z
    .string({ error: 'Enter an email' })
    .trim()
    .toLowerCase()
    .pipe(
      z.email({ error: 'Enter a valid email' }).max(255, 'Email must be at most 255 characters'),
    ),
  country: countrySchema,
  department: departmentSchema,
  jobTitle: jobTitleSchema,
  annualSalary: z
    .number({ error: 'Salary must be a number' })
    .int('Salary must be a whole number')
    .min(1, 'Salary must be more than 0')
    .max(MAX_ANNUAL_SALARY, 'Salary must be at most 100,000,000'),
  hireDate: z.iso
    .date({ error: 'Enter a date as YYYY-MM-DD' })
    .refine((date) => date >= EARLIEST_HIRE_DATE, 'Hire date cannot be before 1950')
    .refine((date) => date <= latestAllowedHireDate(), 'Hire date cannot be in the future'),
}

// Shared with the API, which runs the same check against the stored
// department when an update sends only one of the two
export function jobTitleNotInDepartmentMessage(jobTitle: JobTitle, department: Department) {
  return `${jobTitle} is not a job title in ${department}`
}

function checkJobTitleInDepartment(
  value: { department?: Department; jobTitle?: JobTitle },
  ctx: z.RefinementCtx,
) {
  const { department, jobTitle } = value
  if (department === undefined || jobTitle === undefined) return
  if (isJobTitleInDepartment(department, jobTitle)) return
  ctx.addIssue({
    code: 'custom',
    path: ['jobTitle'],
    message: jobTitleNotInDepartmentMessage(jobTitle, department),
  })
}

// Shown when the request body is missing or isn't a JSON object at all
const notAnObject = { error: 'Send the employee as a JSON object' }

export const createEmployeeSchema = z
  .object(employeeFields, notAnObject)
  .superRefine(checkJobTitleInDepartment)

export const updateEmployeeSchema = z
  .object(employeeFields, notAnObject)
  .partial()
  .refine(
    (value) => Object.values<unknown>(value).some((field) => field !== undefined),
    'Send at least one field to change',
  )
  .superRefine(checkJobTitleInDepartment)

export const employeeListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().pipe(z.literal(PAGE_SIZES)).default(25),
    search: z
      .string()
      .trim()
      .transform((value) => (value === '' ? undefined : value))
      .pipe(z.string().min(2, 'Type at least 2 characters to search').max(100).optional())
      .optional(),
    country: countrySchema.optional(),
    department: departmentSchema.optional(),
    jobTitle: jobTitleSchema.optional(),
    sortBy: z.enum(SORT_FIELDS).default('fullName'),
    sortOrder: z.enum(SORT_ORDERS).default('asc'),
  })
  // Salaries are in each country's own currency, so ordering them across
  // countries would put 3,200,000 INR above 120,000 USD.
  .refine((query) => query.sortBy !== 'annualSalary' || query.country !== undefined, {
    path: ['sortBy'],
    message: 'Pick a country to sort by salary, since each country pays in its own currency',
  })

const employeeIdMessage = 'Employee id must be a positive whole number'

// The id column is a Postgres integer, so anything above this can't exist
// and would make the query fail instead of returning "not found".
export const MAX_EMPLOYEE_ID = 2_147_483_647

export const employeeIdParamSchema = z.object({
  id: z
    .string({ error: employeeIdMessage })
    .regex(/^\d+$/, employeeIdMessage)
    .transform(Number)
    .pipe(z.number().int().min(1, employeeIdMessage).max(MAX_EMPLOYEE_ID, employeeIdMessage)),
})

export const countryParamSchema = z.object({ country: countrySchema })

export const underpaidQuerySchema = z.object({
  threshold: z.coerce.number().gt(0).max(1).default(0.8),
})

export const employeeSchema = z.object({
  id: z.number().int().positive(),
  fullName: z.string(),
  email: z.string(),
  country: countrySchema,
  currency: z.enum(CURRENCIES),
  department: departmentSchema,
  jobTitle: jobTitleSchema,
  annualSalary: z.number().int(),
  hireDate: z.iso.date(),
})

export const employeeListResponseSchema = z.object({
  data: z.array(employeeSchema),
  page: z.number().int(),
  pageSize: z.literal(PAGE_SIZES),
  total: z.number().int(),
})

export const metaResponseSchema = z.object({
  countries: z.array(
    z.object({ code: countrySchema, name: z.string(), currency: z.enum(CURRENCIES) }),
  ),
  departments: z.array(z.object({ name: departmentSchema, jobTitles: z.array(jobTitleSchema) })),
})

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>
export type CountryParam = z.infer<typeof countryParamSchema>
export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>
export type MetaResponse = z.infer<typeof metaResponseSchema>
export type UnderpaidQuery = z.infer<typeof underpaidQuerySchema>
export type Employee = z.infer<typeof employeeSchema>
export type EmployeeListResponse = z.infer<typeof employeeListResponseSchema>
export type SortField = (typeof SORT_FIELDS)[number]
export type SortOrder = (typeof SORT_ORDERS)[number]
export type PageSize = (typeof PAGE_SIZES)[number]
