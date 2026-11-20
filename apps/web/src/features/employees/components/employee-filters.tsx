import {
  COUNTRIES,
  DEPARTMENTS,
  JOB_TITLES,
  jobTitlesForDepartment,
  type CountryCode,
  type Department,
  type JobTitle,
} from '@salary/shared'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ListParams } from '../list-params'

// Radix select can't hold an empty value, so "all" stands for no filter
const ALL = 'all'

type EmployeeFiltersProps = {
  params: ListParams
  searchText: string
  onSearchTextChange: (text: string) => void
  onChange: (change: Partial<ListParams>) => void
}

function pick<T extends string>(value: string, options: readonly T[]): T | undefined {
  return options.find((option) => option === value)
}

export function EmployeeFilters({
  params,
  searchText,
  onSearchTextChange,
  onChange,
}: EmployeeFiltersProps) {
  const jobTitles = params.department ? jobTitlesForDepartment(params.department) : JOB_TITLES
  const countryCodes = COUNTRIES.map((country) => country.code)
  const departmentNames = DEPARTMENTS.map((department) => department.name)

  return (
    <div className="grid gap-3 md:grid-cols-[1fr_repeat(3,minmax(0,12rem))]">
      <div className="relative">
        <Search
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        />
        <Input
          type="search"
          aria-label="Search employees"
          placeholder="Search by name or email"
          className="pl-8"
          value={searchText}
          onChange={(event) => {
            onSearchTextChange(event.target.value)
          }}
        />
      </div>
      <Select
        value={params.country ?? ALL}
        onValueChange={(value) => {
          onChange({ country: pick<CountryCode>(value, countryCodes) })
        }}
      >
        <SelectTrigger aria-label="Country" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All countries</SelectItem>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.department ?? ALL}
        onValueChange={(value) => {
          onChange({ department: pick<Department>(value, departmentNames) })
        }}
      >
        <SelectTrigger aria-label="Department" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All departments</SelectItem>
          {DEPARTMENTS.map((department) => (
            <SelectItem key={department.name} value={department.name}>
              {department.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.jobTitle ?? ALL}
        onValueChange={(value) => {
          onChange({ jobTitle: pick<JobTitle>(value, JOB_TITLES) })
        }}
      >
        <SelectTrigger aria-label="Job title" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All job titles</SelectItem>
          {jobTitles.map((jobTitle) => (
            <SelectItem key={jobTitle} value={jobTitle}>
              {jobTitle}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
