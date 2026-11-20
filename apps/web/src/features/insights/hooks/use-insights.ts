'use client'

import type { CountryCode } from '@salary/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  fetchCountryInsights,
  fetchDepartmentInsights,
  fetchJobTitleInsights,
  fetchUnderpaid,
} from '../api/insights-api'

// Each country query waits until a country is known, so nothing is asked for
// "no country" while the overview is still loading.
function requireCountry(country: CountryCode | undefined) {
  if (country === undefined) throw new Error('A country is needed for this insight')
  return country
}

export function useCountryInsights() {
  return useQuery({ queryKey: ['insights', 'countries'], queryFn: fetchCountryInsights })
}

export function useJobTitleInsights(country: CountryCode | undefined) {
  return useQuery({
    queryKey: ['insights', 'job-titles', country],
    queryFn: () => fetchJobTitleInsights(requireCountry(country)),
    enabled: country !== undefined,
    placeholderData: keepPreviousData,
  })
}

export function useDepartmentInsights(country: CountryCode | undefined) {
  return useQuery({
    queryKey: ['insights', 'departments', country],
    queryFn: () => fetchDepartmentInsights(requireCountry(country)),
    enabled: country !== undefined,
    placeholderData: keepPreviousData,
  })
}

export function useUnderpaid(country: CountryCode | undefined, threshold: number) {
  return useQuery({
    queryKey: ['insights', 'underpaid', country, threshold],
    queryFn: () => fetchUnderpaid(requireCountry(country), threshold),
    enabled: country !== undefined,
    placeholderData: keepPreviousData,
  })
}
