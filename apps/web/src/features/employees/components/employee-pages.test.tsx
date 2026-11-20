import type { Employee } from '@salary/shared'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api-client'
import { createEmployee, deleteEmployee, fetchEmployee, updateEmployee } from '../api/employees-api'
import { EditEmployeeView } from './edit-employee-view'
import { NewEmployeeView } from './new-employee-view'

vi.mock('../api/employees-api', () => ({
  createEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
  fetchEmployee: vi.fn(),
  updateEmployee: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

const router = vi.hoisted(() => ({ push: vi.fn(), search: '' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: router.push }),
  useSearchParams: () => new URLSearchParams(router.search),
}))

const fromFilteredList = `from=${encodeURIComponent('/employees?country=IN&page=3')}`

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

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  router.search = ''
})

describe('adding an employee', () => {
  it('adds them, says so and goes back to the list', async () => {
    vi.mocked(createEmployee).mockResolvedValue(asha)
    renderWithQuery(<NewEmployeeView />)
    await userEvent.type(screen.getByLabelText('Full name'), 'Asha Patel')
    await userEvent.type(screen.getByLabelText('Email'), 'asha.patel@acme.test')
    await userEvent.selectOptions(screen.getByLabelText('Country'), 'IN')
    await userEvent.selectOptions(screen.getByLabelText('Department'), 'Engineering')
    await userEvent.selectOptions(screen.getByLabelText('Job title'), 'Software Engineer')
    await userEvent.type(screen.getByLabelText('Annual salary (INR)'), '1800000')
    await userEvent.type(screen.getByLabelText('Hire date'), '2022-04-11')
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }))
    expect(vi.mocked(createEmployee).mock.calls[0]?.[0]).toMatchObject({
      fullName: 'Asha Patel',
      annualSalary: 1800000,
    })
    expect(toast.success).toHaveBeenCalledWith('Asha Patel was added')
    expect(router.push).toHaveBeenCalledWith('/employees')
  })
})

describe('the add page', () => {
  it('offers a way back to the list without adding anyone', () => {
    renderWithQuery(<NewEmployeeView />)
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/employees')
  })
})

describe('changing an employee', () => {
  it('fills the form with the employee', async () => {
    vi.mocked(fetchEmployee).mockResolvedValue(asha)
    renderWithQuery(<EditEmployeeView id="1" />)
    expect(await screen.findByDisplayValue('Asha Patel')).toBeInTheDocument()
  })

  it('saves changes, says so and goes back to the list', async () => {
    vi.mocked(fetchEmployee).mockResolvedValue(asha)
    vi.mocked(updateEmployee).mockResolvedValue({ ...asha, annualSalary: 2000000 })
    renderWithQuery(<EditEmployeeView id="1" />)
    const salary = await screen.findByLabelText('Annual salary (INR)')
    await userEvent.clear(salary)
    await userEvent.type(salary, '2000000')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(updateEmployee).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ annualSalary: 2000000 }),
    )
    expect(toast.success).toHaveBeenCalledWith('Changes to Asha Patel were saved')
    expect(router.push).toHaveBeenCalledWith('/employees')
  })

  it('says so when the employee does not exist', async () => {
    vi.mocked(fetchEmployee).mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Employee not found'))
    renderWithQuery(<EditEmployeeView id="999" />)
    expect(await screen.findByText('Employee not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to employees' })).toHaveAttribute(
      'href',
      '/employees',
    )
  })

  it('says not found for an id that is not a number, without asking the api', async () => {
    renderWithQuery(<EditEmployeeView id="abc" />)
    expect(await screen.findByText('Employee not found')).toBeInTheDocument()
    expect(fetchEmployee).not.toHaveBeenCalled()
  })
})

describe('going back to the list it came from', () => {
  it('returns to the filtered list after saving', async () => {
    router.search = fromFilteredList
    vi.mocked(fetchEmployee).mockResolvedValue(asha)
    vi.mocked(updateEmployee).mockResolvedValue(asha)
    renderWithQuery(<EditEmployeeView id="1" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    expect(router.push).toHaveBeenCalledWith('/employees?country=IN&page=3')
  })

  it('returns to the filtered list after deleting', async () => {
    router.search = fromFilteredList
    vi.mocked(fetchEmployee).mockResolvedValue(asha)
    vi.mocked(deleteEmployee).mockResolvedValue()
    renderWithQuery(<EditEmployeeView id="1" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Asha Patel' }))
    expect(router.push).toHaveBeenCalledWith('/employees?country=IN&page=3')
  })

  it('points cancel on the edit page at the filtered list', async () => {
    router.search = fromFilteredList
    vi.mocked(fetchEmployee).mockResolvedValue(asha)
    renderWithQuery(<EditEmployeeView id="1" />)
    expect(await screen.findByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/employees?country=IN&page=3',
    )
  })

  it('points cancel on the add page at the filtered list', () => {
    router.search = fromFilteredList
    renderWithQuery(<NewEmployeeView />)
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/employees?country=IN&page=3',
    )
  })

  it('ignores a return link to another site', async () => {
    router.search = `from=${encodeURIComponent('https://evil.example')}`
    vi.mocked(fetchEmployee).mockResolvedValue(asha)
    vi.mocked(updateEmployee).mockResolvedValue(asha)
    renderWithQuery(<EditEmployeeView id="1" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Save changes' }))
    expect(router.push).toHaveBeenCalledWith('/employees')
  })
})

describe('deleting an employee', () => {
  it('asks first, then deletes, says so and goes back to the list', async () => {
    vi.mocked(fetchEmployee).mockResolvedValue(asha)
    vi.mocked(deleteEmployee).mockResolvedValue()
    renderWithQuery(<EditEmployeeView id="1" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete Asha Patel?' })
    expect(dialog).toHaveTextContent("can't be undone")
    await userEvent.click(screen.getByRole('button', { name: 'Delete Asha Patel' }))
    expect(deleteEmployee).toHaveBeenCalledWith(1)
    expect(toast.success).toHaveBeenCalledWith('Asha Patel was deleted')
    expect(router.push).toHaveBeenCalledWith('/employees')
  })

  it('does not delete when the dialog is cancelled', async () => {
    vi.mocked(fetchEmployee).mockResolvedValue(asha)
    renderWithQuery(<EditEmployeeView id="1" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(deleteEmployee).not.toHaveBeenCalled()
  })
})
