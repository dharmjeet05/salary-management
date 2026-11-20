import type { EmployeeListResponse } from '@salary/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api-client'
import { fetchEmployees } from '../api/employees-api'
import { EmployeesView } from './employees-view'

vi.mock('../api/employees-api', () => ({ fetchEmployees: vi.fn() }))

const router = vi.hoisted(() => ({ push: vi.fn(), search: '' }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/employees',
  useRouter: () => ({ push: router.push }),
  useSearchParams: () => new URLSearchParams(router.search),
}))

const fetchEmployeesMock = vi.mocked(fetchEmployees)

const onePage: EmployeeListResponse = {
  data: [
    {
      id: 1,
      fullName: 'Asha Patel',
      email: 'asha.patel@acme.test',
      country: 'IN',
      currency: 'INR',
      department: 'Engineering',
      jobTitle: 'Software Engineer',
      annualSalary: 1800000,
      hireDate: '2022-04-11',
    },
  ],
  page: 1,
  pageSize: 25,
  total: 1,
}

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <EmployeesView />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  router.search = ''
  router.push.mockReset()
  fetchEmployeesMock.mockReset()
})

describe('employees page', () => {
  it('shows a loading state while the list loads', () => {
    fetchEmployeesMock.mockReturnValue(new Promise(() => undefined))
    renderView()
    expect(screen.getByRole('status', { name: 'Loading employees' })).toBeInTheDocument()
  })

  it('offers to add an employee', () => {
    fetchEmployeesMock.mockReturnValue(new Promise(() => undefined))
    renderView()
    expect(screen.getByRole('link', { name: 'Add employee' })).toHaveAttribute(
      'href',
      '/employees/new',
    )
  })

  it('remembers the filtered list in the Add employee link', () => {
    router.search = 'country=IN'
    fetchEmployeesMock.mockReturnValue(new Promise(() => undefined))
    renderView()
    expect(screen.getByRole('link', { name: 'Add employee' })).toHaveAttribute(
      'href',
      '/employees/new?from=%2Femployees%3Fcountry%3DIN',
    )
  })

  it('shows the employees once they load', async () => {
    fetchEmployeesMock.mockResolvedValue(onePage)
    renderView()
    expect(await screen.findByText('Asha Patel')).toBeInTheDocument()
  })

  it('shows how many employees match', async () => {
    fetchEmployeesMock.mockResolvedValue({ ...onePage, total: 10000 })
    renderView()
    expect(await screen.findByText('10,000 employees')).toBeInTheDocument()
  })

  it('asks the api for the list in the url', async () => {
    router.search = 'country=IN&page=2'
    fetchEmployeesMock.mockResolvedValue(onePage)
    renderView()
    await screen.findByText('Asha Patel')
    expect(fetchEmployeesMock).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'IN', page: 2 }),
    )
  })

  it('says so when no employee matches, with a way to clear the filters', async () => {
    router.search = 'country=IN'
    fetchEmployeesMock.mockResolvedValue({ ...onePage, data: [], total: 0 })
    renderView()
    expect(await screen.findByText('No employees match your filters')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(router.push).toHaveBeenCalledWith('/employees', { scroll: false })
  })

  it('says when a page is past the end and offers the first page', async () => {
    router.search = 'page=999'
    fetchEmployeesMock.mockResolvedValue({ ...onePage, data: [], page: 999, total: 10000 })
    renderView()
    expect(await screen.findByText('This page is past the end of the list')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Go to the first page' }))
    expect(router.push).toHaveBeenCalledWith('/employees', { scroll: false })
  })

  it('keeps the sort and rows per page when filters are cleared', async () => {
    router.search = 'search=zzz&pageSize=50&sortBy=hireDate'
    fetchEmployeesMock.mockResolvedValue({ ...onePage, data: [], pageSize: 50, total: 0 })
    renderView()
    await userEvent.click(await screen.findByRole('button', { name: 'Clear filters' }))
    expect(router.push).toHaveBeenCalledWith('/employees?pageSize=50&sortBy=hireDate', {
      scroll: false,
    })
  })

  it('shows the error with a way to try again', async () => {
    fetchEmployeesMock.mockRejectedValueOnce(
      new ApiError(
        0,
        'NETWORK_ERROR',
        'Could not reach the server. Check your connection and try again.',
      ),
    )
    fetchEmployeesMock.mockResolvedValueOnce(onePage)
    renderView()
    expect(
      await screen.findByText('Could not reach the server. Check your connection and try again.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Asha Patel')).toBeInTheDocument()
  })

  it('puts the search in the url once typing stops', async () => {
    fetchEmployeesMock.mockResolvedValue(onePage)
    renderView()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search employees' }), 'patel')
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith('/employees?search=patel', { scroll: false })
    })
  })

  it('does not put every key press in the url', async () => {
    fetchEmployeesMock.mockResolvedValue(onePage)
    renderView()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search employees' }), 'patel')
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledTimes(1)
    })
  })
})
