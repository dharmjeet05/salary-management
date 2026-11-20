import {
  countryInsightsResponseSchema,
  departmentInsightsResponseSchema,
  jobTitleInsightsResponseSchema,
  underpaidResponseSchema,
  type CountryCode,
} from '@salary/shared'
import { apiFetch } from '@/lib/api-client'

export function fetchCountryInsights() {
  return apiFetch('/api/insights/countries', countryInsightsResponseSchema)
}

export function fetchJobTitleInsights(country: CountryCode) {
  return apiFetch(`/api/insights/countries/${country}/job-titles`, jobTitleInsightsResponseSchema)
}

export function fetchDepartmentInsights(country: CountryCode) {
  return apiFetch(
    `/api/insights/countries/${country}/departments`,
    departmentInsightsResponseSchema,
  )
}

export function fetchUnderpaid(country: CountryCode, threshold: number) {
  return apiFetch(`/api/insights/countries/${country}/underpaid`, underpaidResponseSchema, {
    query: { threshold },
  })
}
