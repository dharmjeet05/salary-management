import {
  currencyForCountry,
  type CountryCode,
  type CountryInsightsResponse,
  type DepartmentInsightsResponse,
  type JobTitleInsightsResponse,
  type UnderpaidResponse,
} from '@salary/shared'
import type { InsightsRepository } from '../repositories/insights-repository'

export function createInsightsService(repository: InsightsRepository) {
  return {
    async countries(): Promise<CountryInsightsResponse> {
      return { countries: await repository.countryStats() }
    },

    async jobTitles(country: CountryCode): Promise<JobTitleInsightsResponse> {
      return {
        country,
        currency: currencyForCountry(country),
        jobTitles: await repository.jobTitleStats(country),
      }
    },

    async departments(country: CountryCode): Promise<DepartmentInsightsResponse> {
      return {
        country,
        currency: currencyForCountry(country),
        departments: await repository.departmentStats(country),
      }
    },

    async underpaid(country: CountryCode, threshold: number): Promise<UnderpaidResponse> {
      return {
        country,
        currency: currencyForCountry(country),
        threshold,
        employees: await repository.underpaid(country, threshold),
      }
    },
  }
}

export type InsightsService = ReturnType<typeof createInsightsService>
