import {
  COUNTRIES,
  DEPARTMENTS,
  currencyForCountry,
  jobTitlesForDepartment,
  type CountryCode,
} from '@salary/shared'
import type { NewEmployeeRow } from '../schema'
import { createRandom, type Random } from './random'
import {
  COUNTRY_SEED,
  DEPARTMENT_WEIGHTS,
  EARLIEST_SEED_HIRE_DATE,
  JOB_TITLE_SEED,
  LATEST_SEED_HIRE_DATE,
} from './seed-data'

const DAY_MS = 24 * 60 * 60 * 1000
const UNDERPAID_SHARE = 0.03

// Exact counts per country from the shares. Rounding leftovers go to the
// first country, so the total is always `count`.
function countryOrder(count: number, random: Random): CountryCode[] {
  const quotas = COUNTRIES.map((country) => ({
    code: country.code,
    quota: Math.floor(count * COUNTRY_SEED[country.code].share),
  }))
  const assigned = quotas.reduce((sum, item) => sum + item.quota, 0)
  const codes = quotas.flatMap((item, index) =>
    Array.from({ length: item.quota + (index === 0 ? count - assigned : 0) }, () => item.code),
  )
  return random.shuffle(codes)
}

function hireDate(random: Random) {
  const start = Date.parse(EARLIEST_SEED_HIRE_DATE)
  const days = Math.round((Date.parse(LATEST_SEED_HIRE_DATE) - start) / DAY_MS)
  return new Date(start + random.int(0, days) * DAY_MS).toISOString().slice(0, 10)
}

type PersonName = { firstName: string; lastName: string }

// Every full name once: each country walks its own shuffled list of every
// first and last name pair, and skips a name another country already took.
function createNamePicker(random: Random) {
  const taken = new Set<string>()
  const queues = new Map(
    COUNTRIES.map(({ code }) => {
      const { firstNames, lastNames } = COUNTRY_SEED[code]
      const pairs = firstNames.flatMap((firstName) =>
        lastNames.map((lastName): PersonName => ({ firstName, lastName })),
      )
      return [code, random.shuffle(pairs)]
    }),
  )
  return (country: CountryCode): PersonName => {
    const queue = queues.get(country) ?? []
    let name = queue.pop()
    while (name && taken.has(`${name.firstName} ${name.lastName}`)) name = queue.pop()
    if (!name) throw new Error(`Not enough different names for ${country}, add more to the seed`)
    taken.add(`${name.firstName} ${name.lastName}`)
    return name
  }
}

const departmentChoices = DEPARTMENTS.map((department) => ({
  value: department.name,
  weight: DEPARTMENT_WEIGHTS[department.name],
}))

export function generateEmployees({ count, seed }: { count: number; seed: number }) {
  const random = createRandom(seed)
  const pickName = createNamePicker(random)
  return countryOrder(count, random).map((country, index): NewEmployeeRow => {
    const place = COUNTRY_SEED[country]
    const { firstName, lastName } = pickName(country)
    const department = random.weighted(departmentChoices)
    const jobTitle = random.weighted(
      jobTitlesForDepartment(department).map((title) => ({
        value: title,
        weight: JOB_TITLE_SEED[title].weight,
      })),
    )
    // A few people sit well under their band, so the underpaid insight has
    // real cases. Everyone else is within 15% of it.
    const isUnderpaid = random.next() < UNDERPAID_SHARE
    const spread = isUnderpaid ? 0.6 + random.next() * 0.18 : 0.85 + random.next() * 0.3
    const salary = JOB_TITLE_SEED[jobTitle].baseUsd * place.costFactor * place.usdRate * spread
    return {
      fullName: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}.${String(index + 1)}@acme.test`.toLowerCase(),
      country,
      currency: currencyForCountry(country),
      department,
      jobTitle,
      annualSalary: Math.max(1000, Math.round(salary / 1000) * 1000),
      hireDate: hireDate(random),
    }
  })
}
