import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { underpaid } from '../test-data'
import { UnderpaidTable } from './underpaid-table'

describe('paid well below their peers', () => {
  it('shows the salary, the median for the job title and the share', () => {
    render(<UnderpaidTable underpaid={underpaid} returnTo="/insights?country=IN" />)
    expect(screen.getByText('₹14,52,000')).toBeInTheDocument()
    expect(screen.getByText('₹24,21,000')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('links each name to their edit page and back to insights', () => {
    render(<UnderpaidTable underpaid={underpaid} returnTo="/insights?country=IN" />)
    expect(screen.getByRole('link', { name: 'Aarav Gupta' })).toHaveAttribute(
      'href',
      '/employees/837/edit?from=%2Finsights%3Fcountry%3DIN',
    )
  })
})
