import type { JobTitleInsightsResponse } from '@salary/shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/format'

export function JobTitleTable({ insights }: { insights: JobTitleInsightsResponse }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job title</TableHead>
          <TableHead className="text-right">People</TableHead>
          <TableHead className="text-right">Median</TableHead>
          <TableHead className="text-right">Average</TableHead>
          <TableHead className="text-right">Lowest</TableHead>
          <TableHead className="text-right">Highest</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {insights.jobTitles.map((row) => (
          <TableRow key={row.jobTitle}>
            <TableCell>
              <div className="font-medium">{row.jobTitle}</div>
              <div className="text-muted-foreground text-xs">{row.department}</div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.headcount.toLocaleString('en')}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatMoney(row.medianSalary, insights.currency)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(row.averageSalary, insights.currency)}
            </TableCell>
            <TableCell className="text-muted-foreground text-right tabular-nums">
              {formatMoney(row.minSalary, insights.currency)}
            </TableCell>
            <TableCell className="text-muted-foreground text-right tabular-nums">
              {formatMoney(row.maxSalary, insights.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
