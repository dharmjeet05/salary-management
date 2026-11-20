import type { EmployeeRow } from '@salary/db'
import {
  currencyForCountry,
  isJobTitleInDepartment,
  jobTitleNotInDepartmentMessage,
  type CreateEmployeeInput,
  type Employee,
  type UpdateEmployeeInput,
} from '@salary/shared'
import { NotFoundError, ValidationError } from '../errors/domain-errors'
import type { EmployeeRepository } from '../repositories/employee-repository'

function toEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    country: row.country,
    currency: row.currency,
    department: row.department,
    jobTitle: row.jobTitle,
    annualSalary: row.annualSalary,
    hireDate: row.hireDate,
  }
}

export function createEmployeeService(repository: EmployeeRepository) {
  return {
    async getById(id: number): Promise<Employee> {
      const row = await repository.findById(id)
      if (!row) throw new NotFoundError('Employee')
      return toEmployee(row)
    },

    async create(input: CreateEmployeeInput): Promise<Employee> {
      const row = await repository.insert({ ...input, currency: currencyForCountry(input.country) })
      return toEmployee(row)
    },

    async update(id: number, input: UpdateEmployeeInput): Promise<Employee> {
      // The schema checks the pair when both are sent. With only one of them,
      // the other half comes from the stored row, so only then is it read.
      const sendsOnlyOneOfThePair =
        (input.department === undefined) !== (input.jobTitle === undefined)
      if (sendsOnlyOneOfThePair) {
        const current = await repository.findById(id)
        if (!current) throw new NotFoundError('Employee')
        const department = input.department ?? current.department
        const jobTitle = input.jobTitle ?? current.jobTitle
        if (!isJobTitleInDepartment(department, jobTitle)) {
          throw new ValidationError([
            { path: 'jobTitle', message: jobTitleNotInDepartmentMessage(jobTitle, department) },
          ])
        }
      }

      const changes = input.country
        ? { ...input, currency: currencyForCountry(input.country) }
        : input
      const row = await repository.update(id, changes)
      if (!row) throw new NotFoundError('Employee')
      return toEmployee(row)
    },

    async delete(id: number): Promise<void> {
      const deleted = await repository.delete(id)
      if (!deleted) throw new NotFoundError('Employee')
    },
  }
}

export type EmployeeService = ReturnType<typeof createEmployeeService>
