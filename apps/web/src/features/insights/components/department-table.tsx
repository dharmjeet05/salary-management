import type { DepartmentInsightsResponse } from '@salary/shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/format'

export function DepartmentTable({ insights }: { insights: DepartmentInsightsResponse }) {
  // bars compare departments inside one country, never across currencies
  const biggest = Math.max(...insights.departments.map((row) => row.totalSalary), 1)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Department</TableHead>
          <TableHead className="text-right">People</TableHead>
          <TableHead className="text-right">Yearly cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {insights.departments.map((row) => (
          <TableRow key={row.department}>
            <TableCell>
              <div className="font-medium">{row.department}</div>
              <div className="bg-muted mt-1.5 h-1.5 w-full max-w-48 rounded-full" aria-hidden>
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${String((row.totalSalary / biggest) * 100)}%` }}
                />
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.headcount.toLocaleString('en')}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(row.totalSalary, insights.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
