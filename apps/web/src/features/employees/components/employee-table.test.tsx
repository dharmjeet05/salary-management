import type { Employee } from '@salary/shared'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmployeeTable } from './employee-table'

const asha: Employee = {
  id: 1,
  fullName: 'Asha Patel',
  email: 'asha.patel@acme.test',
  country: 'IN',
  currency: 'INR',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  annualSalary: 1800000,
  hireDate: '2022-04-11',
}

function renderTable(props: Partial<Parameters<typeof EmployeeTable>[0]> = {}) {
  const onSort = vi.fn()
  render(
    <EmployeeTable
      employees={[asha]}
      sortBy="fullName"
      sortOrder="asc"
      canSortBySalary={false}
      onSort={onSort}
      {...props}
    />,
  )
  return { onSort }
}

describe('employee table', () => {
  it('shows the salary in the employee currency', () => {
    renderTable()
    expect(screen.getByText('₹18,00,000')).toBeInTheDocument()
  })

  it('shows the hire date as day, month and year', () => {
    renderTable()
    expect(screen.getByText('11 Apr 2022')).toBeInTheDocument()
  })

  it('shows the country by name', () => {
    renderTable()
    expect(screen.getByText('India')).toBeInTheDocument()
  })

  it('shows the email under the name', () => {
    renderTable()
    const row = screen.getByRole('row', { name: /Asha Patel/ })
    expect(within(row).getByText('asha.patel@acme.test')).toBeInTheDocument()
  })

  it('marks the column the list is sorted by', () => {
    renderTable()
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
  })

  it('asks to sort by hire date when its header is clicked', async () => {
    const { onSort } = renderTable()
    await userEvent.click(screen.getByRole('button', { name: /Hire date/ }))
    expect(onSort).toHaveBeenCalledWith('hireDate')
  })

  it('locks the salary sort until a country is picked', () => {
    renderTable({ canSortBySalary: false })
    expect(screen.getByRole('button', { name: /Salary/ })).toBeDisabled()
  })

  it('opens the salary sort once a country is picked', () => {
    renderTable({ canSortBySalary: true })
    expect(screen.getByRole('button', { name: /Salary/ })).toBeEnabled()
  })
})
