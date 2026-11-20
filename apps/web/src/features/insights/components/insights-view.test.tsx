import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api-client'
import {
  fetchCountryInsights,
  fetchDepartmentInsights,
  fetchJobTitleInsights,
  fetchUnderpaid,
} from '../api/insights-api'
import { countries, departments, jobTitles, underpaid } from '../test-data'
import { InsightsView } from './insights-view'

vi.mock('../api/insights-api', () => ({
  fetchCountryInsights: vi.fn(),
  fetchDepartmentInsights: vi.fn(),
  fetchJobTitleInsights: vi.fn(),
  fetchUnderpaid: vi.fn(),
}))

const router = vi.hoisted(() => ({ push: vi.fn(), search: '' }))
vi.mock('next/navigation', () => ({
  usePathname: () => '/insights',
  useRouter: () => ({ push: router.push }),
  useSearchParams: () => new URLSearchParams(router.search),
}))

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = () => (
    <QueryClientProvider client={client}>
      <InsightsView />
    </QueryClientProvider>
  )
  const { rerender } = render(view())
  return {
    rerender: () => {
      rerender(view())
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  router.search = ''
  vi.mocked(fetchCountryInsights).mockResolvedValue(countries)
  vi.mocked(fetchJobTitleInsights).mockResolvedValue(jobTitles)
  vi.mocked(fetchDepartmentInsights).mockResolvedValue(departments)
  vi.mocked(fetchUnderpaid).mockResolvedValue(underpaid)
})

describe('insights page', () => {
  it('opens the biggest country when none is picked', async () => {
    renderView()
    await waitFor(() => {
      expect(fetchJobTitleInsights).toHaveBeenCalledWith('IN')
    })
  })

  it('opens the country in the url', async () => {
    router.search = 'country=US'
    renderView()
    await waitFor(() => {
      expect(fetchDepartmentInsights).toHaveBeenCalledWith('US')
    })
  })

  it('puts a picked country in the url', async () => {
    renderView()
    await userEvent.click(await screen.findByRole('button', { name: 'United States' }))
    expect(router.push).toHaveBeenCalledWith('/insights?country=US', { scroll: false })
  })

  it('asks for the underpaid list with the threshold from the url', async () => {
    router.search = 'country=IN&threshold=0.7'
    renderView()
    await waitFor(() => {
      expect(fetchUnderpaid).toHaveBeenCalledWith('IN', 0.7)
    })
  })

  it('says who was checked when nobody is underpaid', async () => {
    router.search = 'country=IN'
    vi.mocked(fetchUnderpaid).mockResolvedValue({ ...underpaid, employees: [] })
    renderView()
    expect(
      await screen.findByText('Nobody in India is under 80% of the median for their job title'),
    ).toBeInTheDocument()
  })

  it('shows the department cost in the country currency', async () => {
    router.search = 'country=IN'
    renderView()
    expect(await screen.findByText('₹2,47,29,52,000')).toBeInTheDocument()
  })

  it("never shows the last country's numbers under the next country's name", async () => {
    router.search = 'country=IN'
    const { rerender } = renderView()
    expect(await screen.findByText('₹2,47,29,52,000')).toBeInTheDocument()

    vi.mocked(fetchDepartmentInsights).mockReturnValue(new Promise(() => undefined))
    router.search = 'country=US'
    rerender()

    expect(
      await screen.findByRole('status', { name: 'Loading cost by department' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'United States' })).toBeInTheDocument()
    expect(screen.queryByText('₹2,47,29,52,000')).not.toBeInTheDocument()
  })

  it('says so when nobody works in the picked country', async () => {
    router.search = 'country=BR'
    renderView()
    expect(await screen.findByText('Nobody works in Brazil yet')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Cost by department' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Pay by job title' })).not.toBeInTheDocument()
  })

  it('shows an error with a way to try again', async () => {
    vi.mocked(fetchCountryInsights).mockRejectedValue(
      new ApiError(
        0,
        'NETWORK_ERROR',
        'Could not reach the server. Check your connection and try again.',
      ),
    )
    renderView()
    expect(
      await screen.findByText('Could not reach the server. Check your connection and try again.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
