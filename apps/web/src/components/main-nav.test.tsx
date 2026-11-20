import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MainNav } from './main-nav'

const navigation = vi.hoisted(() => ({ pathname: '/employees' }))

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}))

beforeEach(() => {
  navigation.pathname = '/employees'
})

describe('main navigation', () => {
  it('links to employees and insights', () => {
    render(<MainNav />)
    expect(screen.getByRole('link', { name: 'Employees' })).toHaveAttribute('href', '/employees')
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('href', '/insights')
  })

  it('marks the section you are in', () => {
    navigation.pathname = '/insights'
    render(<MainNav />)
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('aria-current', 'page')
  })

  it('keeps employees marked on an employee edit page', () => {
    navigation.pathname = '/employees/12/edit'
    render(<MainNav />)
    expect(screen.getByRole('link', { name: 'Employees' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark the other section', () => {
    render(<MainNav />)
    expect(screen.getByRole('link', { name: 'Insights' })).not.toHaveAttribute('aria-current')
  })
})
