import { COUNTRIES, type CountryCode, type CountryInsightsResponse } from '@salary/shared'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatMoney } from '@/lib/format'

const countryNames = new Map(COUNTRIES.map((country) => [country.code, country.name]))

type CountryTableProps = {
  countries: CountryInsightsResponse['countries']
  selected: CountryCode | undefined
  onSelect: (country: CountryCode) => void
}

export function CountryTable({ countries, selected, onSelect }: CountryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">People</TableHead>
          <TableHead className="text-right">Median</TableHead>
          <TableHead className="text-right">Average</TableHead>
          <TableHead className="text-right">Lowest</TableHead>
          <TableHead className="text-right">Highest</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {countries.map((row) => {
          const isSelected = row.country === selected
          return (
            <TableRow key={row.country} data-state={isSelected ? 'selected' : undefined}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mx-2.5 font-medium"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelect(row.country)
                  }}
                >
                  {countryNames.get(row.country)}
                </Button>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.headcount.toLocaleString('en')}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatMoney(row.medianSalary, row.currency)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(row.averageSalary, row.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground text-right tabular-nums">
                {formatMoney(row.minSalary, row.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground text-right tabular-nums">
                {formatMoney(row.maxSalary, row.currency)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
