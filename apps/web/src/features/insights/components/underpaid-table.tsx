import type { UnderpaidResponse } from '@salary/shared'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { withReturnTo } from '@/features/employees/return-to'
import { formatMoney } from '@/lib/format'

type UnderpaidTableProps = { underpaid: UnderpaidResponse; returnTo: string }

export function UnderpaidTable({ underpaid, returnTo }: UnderpaidTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Job title</TableHead>
          <TableHead className="text-right">Salary</TableHead>
          <TableHead className="text-right">Median for the job title</TableHead>
          <TableHead className="text-right">Share of median</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {underpaid.employees.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link
                href={withReturnTo(`/employees/${String(row.id)}/edit`, returnTo)}
                className="font-medium underline-offset-4 hover:underline"
              >
                {row.fullName}
              </Link>
            </TableCell>
            <TableCell>
              <div>{row.jobTitle}</div>
              <div className="text-muted-foreground text-xs">{row.department}</div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(row.annualSalary, underpaid.currency)}
            </TableCell>
            <TableCell className="text-muted-foreground text-right tabular-nums">
              {formatMoney(row.medianSalary, underpaid.currency)}
            </TableCell>
            <TableCell className="text-destructive text-right font-medium tabular-nums">
              {row.percentOfMedian}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
