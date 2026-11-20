import type { CreateEmployeeInput } from '@salary/shared'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api-client'
import { EmployeeForm } from './employee-form'

const asha: CreateEmployeeInput = {
  fullName: 'Asha Patel',
  email: 'asha.patel@acme.test',
  country: 'IN',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  annualSalary: 1800000,
  hireDate: '2022-04-11',
}

function renderForm(props: Partial<Parameters<typeof EmployeeForm>[0]> = {}) {
  const onSubmit = vi.fn<(values: CreateEmployeeInput) => Promise<void>>().mockResolvedValue()
  render(<EmployeeForm submitLabel="Add employee" onSubmit={onSubmit} {...props} />)
  return { onSubmit }
}

function jobTitleOptions() {
  const select = screen.getByLabelText<HTMLSelectElement>('Job title')
  return [...select.options].map((option) => option.text)
}

describe('employee form', () => {
  it('asks for each missing field when sent empty', async () => {
    const { onSubmit } = renderForm()
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }))
    expect(await screen.findByText('Enter a name')).toBeInTheDocument()
    expect(screen.getByText('Enter an email')).toBeInTheDocument()
    expect(screen.getByText('Pick a country from the list')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows only the job titles of the picked department', async () => {
    renderForm()
    await userEvent.selectOptions(screen.getByLabelText('Department'), 'Product')
    expect(jobTitleOptions()).toEqual([
      'Pick a job title',
      'Product Manager',
      'Senior Product Manager',
    ])
  })

  it('clears the job title when the new department does not have it', async () => {
    renderForm({ defaultValues: asha })
    await userEvent.selectOptions(screen.getByLabelText('Department'), 'Sales')
    expect(screen.getByLabelText<HTMLSelectElement>('Job title').value).toBe('')
  })

  it('shows the currency of the picked country next to the salary', async () => {
    renderForm()
    await userEvent.selectOptions(screen.getByLabelText('Country'), 'DE')
    expect(screen.getByLabelText('Annual salary (EUR)')).toBeInTheDocument()
  })

  it('sends the values with the salary as a number', async () => {
    const { onSubmit } = renderForm({ defaultValues: asha })
    await userEvent.clear(screen.getByLabelText('Annual salary (INR)'))
    await userEvent.type(screen.getByLabelText('Annual salary (INR)'), '2000000')
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }))
    expect(onSubmit).toHaveBeenCalledWith({ ...asha, annualSalary: 2000000 })
  })

  it('shows an email that is already used on the email field', async () => {
    const message = 'This email is already used by another employee'
    renderForm({
      defaultValues: asha,
      onSubmit: vi
        .fn()
        .mockRejectedValue(new ApiError(409, 'EMAIL_TAKEN', message, [{ path: 'email', message }])),
    })
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }))
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows any other error above the buttons', async () => {
    renderForm({
      defaultValues: asha,
      onSubmit: vi
        .fn()
        .mockRejectedValue(
          new ApiError(
            0,
            'NETWORK_ERROR',
            'Could not reach the server. Check your connection and try again.',
          ),
        ),
    })
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server')
  })
})
