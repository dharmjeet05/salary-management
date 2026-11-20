import type {
  CountryInsightsResponse,
  DepartmentInsightsResponse,
  JobTitleInsightsResponse,
  UnderpaidResponse,
} from '@salary/shared'

export const countries: CountryInsightsResponse = {
  countries: [
    {
      country: 'IN',
      currency: 'INR',
      headcount: 3500,
      minSalary: 549000,
      maxSalary: 4383000,
      averageSalary: 1840000,
      medianSalary: 1747500,
    },
    {
      country: 'US',
      currency: 'USD',
      headcount: 2000,
      minSalary: 48000,
      maxSalary: 251000,
      averageSalary: 112000,
      medianSalary: 106000,
    },
  ],
}

export const jobTitles: JobTitleInsightsResponse = {
  country: 'IN',
  currency: 'INR',
  jobTitles: [
    {
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      headcount: 445,
      minSalary: 1600000,
      maxSalary: 2800000,
      averageSalary: 2150000,
      medianSalary: 2132000,
    },
  ],
}

export const departments: DepartmentInsightsResponse = {
  country: 'IN',
  currency: 'INR',
  departments: [
    { department: 'Engineering', headcount: 989, totalSalary: 2472952000 },
    { department: 'Sales', headcount: 520, totalSalary: 618000000 },
  ],
}

export const underpaid: UnderpaidResponse = {
  country: 'IN',
  currency: 'INR',
  threshold: 0.8,
  employees: [
    {
      id: 837,
      fullName: 'Aarav Gupta',
      department: 'Finance',
      jobTitle: 'Finance Manager',
      annualSalary: 1452000,
      medianSalary: 2421000,
      percentOfMedian: 60,
    },
  ],
}
