import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { countries } from '../test-data'
import { CountryTable } from './country-table'

describe('pay by country', () => {
  it('shows each median in that country currency', () => {
    render(<CountryTable countries={countries.countries} selected="IN" onSelect={vi.fn()} />)
    expect(screen.getByText('₹17,47,500')).toBeInTheDocument()
    expect(screen.getByText('$106,000')).toBeInTheDocument()
  })

  it('marks the picked country', () => {
    render(<CountryTable countries={countries.countries} selected="IN" onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'India' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('asks to open a country when it is picked', async () => {
    const onSelect = vi.fn()
    render(<CountryTable countries={countries.countries} selected="IN" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'United States' }))
    expect(onSelect).toHaveBeenCalledWith('US')
  })
})
