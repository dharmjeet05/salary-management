import type { NewEmployeeRow } from '@salary/db'
import type { CreateEmployeeInput } from '@salary/shared'

export function employeeInput(overrides: Partial<CreateEmployeeInput> = {}): CreateEmployeeInput {
  return {
    fullName: 'Asha Patel',
    email: 'asha.patel@acme.test',
    country: 'IN',
    department: 'Engineering',
    jobTitle: 'Software Engineer',
    annualSalary: 1800000,
    hireDate: '2022-04-11',
    ...overrides,
  }
}

export function employeeRow(overrides: Partial<NewEmployeeRow> = {}): NewEmployeeRow {
  return { ...employeeInput(), currency: 'INR', ...overrides }
}
