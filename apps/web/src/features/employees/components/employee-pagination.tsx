import { PAGE_SIZES, type PageSize } from '@salary/shared'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type EmployeePaginationProps = {
  page: number
  pageSize: PageSize
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSize) => void
}

export function EmployeePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: EmployeePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Rows per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            const size = PAGE_SIZES.find((option) => String(option) === value)
            if (size !== undefined) onPageSizeChange(size)
          }}
        >
          <SelectTrigger aria-label="Rows per page" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground tabular-nums">
          Page {page.toLocaleString('en')} of {pageCount.toLocaleString('en')}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => {
            onPageChange(page - 1)
          }}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => {
            onPageChange(page + 1)
          }}
        >
          <ChevronRight aria-hidden />
        </Button>
      </div>
    </div>
  )
}
