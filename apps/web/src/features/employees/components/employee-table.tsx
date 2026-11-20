import { COUNTRIES, type Employee, type SortField, type SortOrder } from '@salary/shared'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatMoney } from '@/lib/format'
import { withReturnTo } from '../return-to'

const countryNames = new Map(COUNTRIES.map((country) => [country.code, country.name]))

type EmployeeTableProps = {
  employees: Employee[]
  sortBy: SortField
  sortOrder: SortOrder
  canSortBySalary: boolean
  onSort: (field: SortField) => void
  returnTo?: string
}

type SortHeaderProps = {
  field: SortField
  label: string
  sortBy: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  disabledReason?: string
  align?: 'left' | 'right'
}

function SortHeader({
  field,
  label,
  sortBy,
  sortOrder,
  onSort,
  disabledReason,
  align = 'left',
}: SortHeaderProps) {
  const isSorted = sortBy === field
  const Icon = !isSorted ? ArrowUpDown : sortOrder === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead
      aria-sort={isSorted ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
      className={align === 'right' ? 'text-right' : undefined}
    >
      {/* A disabled button gets no hover, so the reason sits on a wrapper */}
      <span title={disabledReason} className="inline-flex">
        <Button
          variant="ghost"
          size="sm"
          className="-mx-2.5"
          disabled={disabledReason !== undefined}
          onClick={() => {
            onSort(field)
          }}
        >
          {label}
          <Icon aria-hidden className={isSorted ? undefined : 'text-muted-foreground'} />
        </Button>
      </span>
    </TableHead>
  )
}

export function EmployeeTable({
  employees,
  sortBy,
  sortOrder,
  canSortBySalary,
  onSort,
  returnTo = '/employees',
}: EmployeeTableProps) {
  const sortProps = { sortBy, sortOrder, onSort }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader field="fullName" label="Name" {...sortProps} />
          <TableHead>Country</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Job title</TableHead>
          <SortHeader
            field="annualSalary"
            label="Salary"
            align="right"
            disabledReason={canSortBySalary ? undefined : 'Pick a country to sort by salary'}
            {...sortProps}
          />
          <SortHeader field="hireDate" label="Hire date" {...sortProps} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell>
              <Link
                href={withReturnTo(`/employees/${String(employee.id)}/edit`, returnTo)}
                className="font-medium underline-offset-4 hover:underline"
              >
                {employee.fullName}
              </Link>
              <div className="text-muted-foreground text-xs">{employee.email}</div>
            </TableCell>
            <TableCell>{countryNames.get(employee.country)}</TableCell>
            <TableCell>{employee.department}</TableCell>
            <TableCell>{employee.jobTitle}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(employee.annualSalary, employee.currency)}
            </TableCell>
            <TableCell className="tabular-nums">{formatDate(employee.hireDate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
