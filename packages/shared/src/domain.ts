export const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
] as const

export type Country = (typeof COUNTRIES)[number]
export type CountryCode = Country['code']
export type Currency = Country['currency']

export const COUNTRY_CODES = COUNTRIES.map((country) => country.code)
export const CURRENCIES = COUNTRIES.map((country) => country.currency)

export const DEPARTMENTS = [
  {
    name: 'Engineering',
    jobTitles: [
      'Software Engineer',
      'Senior Software Engineer',
      'Staff Engineer',
      'Engineering Manager',
      'QA Engineer',
    ],
  },
  { name: 'Product', jobTitles: ['Product Manager', 'Senior Product Manager'] },
  { name: 'Design', jobTitles: ['Product Designer', 'Senior Product Designer'] },
  { name: 'Data', jobTitles: ['Data Analyst', 'Data Scientist'] },
  { name: 'Sales', jobTitles: ['Sales Representative', 'Account Executive', 'Sales Manager'] },
  { name: 'Marketing', jobTitles: ['Marketing Specialist', 'Marketing Manager'] },
  { name: 'Customer Support', jobTitles: ['Support Specialist', 'Support Team Lead'] },
  { name: 'Finance', jobTitles: ['Accountant', 'Finance Manager'] },
  { name: 'People', jobTitles: ['HR Generalist', 'HR Manager'] },
  { name: 'Operations', jobTitles: ['Operations Specialist', 'Operations Manager'] },
] as const

export type Department = (typeof DEPARTMENTS)[number]['name']
export type JobTitle = (typeof DEPARTMENTS)[number]['jobTitles'][number]

export const DEPARTMENT_NAMES = DEPARTMENTS.map((department) => department.name)
export const JOB_TITLES = DEPARTMENTS.flatMap((department) => department.jobTitles)

export function currencyForCountry(code: CountryCode): Currency {
  const country = COUNTRIES.find((item) => item.code === code)
  if (!country) throw new Error(`Unknown country code: ${code}`)
  return country.currency
}

export function jobTitlesForDepartment(name: Department): readonly JobTitle[] {
  const department = DEPARTMENTS.find((item) => item.name === name)
  if (!department) throw new Error(`Unknown department: ${name}`)
  return department.jobTitles
}

export function isJobTitleInDepartment(department: Department, jobTitle: JobTitle): boolean {
  return jobTitlesForDepartment(department).includes(jobTitle)
}
