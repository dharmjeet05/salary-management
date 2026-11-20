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
    .refine((date) => date <= latestAllowedHireDate(), 'Hire date cannot be in the future'),
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
    message: `${jobTitle} is not a job title in ${department}`,
  })
}

export const createEmployeeSchema = z.object(employeeFields).superRefine(checkJobTitleInDepartment)

export const updateEmployeeSchema = z
  .object(employeeFields)
  .partial()
  .refine(
    (value) => Object.values<unknown>(value).some((field) => field !== undefined),
    'Send at least one field to change',
  )
  .superRefine(checkJobTitleInDepartment)

export const employeeListQuerySchema = z.object({
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

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type EmployeeListQuery = z.infer<typeof employeeListQuerySchema>
export type CountryParam = z.infer<typeof countryParamSchema>
export type UnderpaidQuery = z.infer<typeof underpaidQuerySchema>
export type Employee = z.infer<typeof employeeSchema>
export type EmployeeListResponse = z.infer<typeof employeeListResponseSchema>
export type SortField = (typeof SORT_FIELDS)[number]
export type SortOrder = (typeof SORT_ORDERS)[number]
export type PageSize = (typeof PAGE_SIZES)[number]
