# Trade-offs

The main decisions, what each one gave up, and when to change it. The goal was good judgement for 10,000 employees and one HR manager, not the most complex system. What was left out of scope, and why, is in [SPEC.md, Part 1](SPEC.md#deliberately-left-out).

## Product

**Every number stays in the employee's own currency.**
Salaries are never converted or added across countries. Insights always start with a country, and the list only sorts by salary once a country is picked.
Gave up: one org wide total, and sorting everyone by pay. A total in USD would need daily exchange rates and would still mislead (3,200,000 INR is not "more" than 120,000 USD).
Change it when: finance asks for a budget view. Then convert with a dated rate and show the rate next to the number.

**"Underpaid" means below a share of the median for the same job title in the same country.**
The default line is 80%, with 70 and 90% to pick from.
Gave up: tenure, level and performance, which the data doesn't have. A person three months into the job shows up next to someone underpaid for years.
Why it's still useful: it is easy to explain to an HR manager, and every name links straight to the record to fix.

**The URL holds the list's state** (search, filters, sort, page, the insights country and threshold).
Gave up: some code, since every edit and cancel has to return to the right view through a checked `?from=` path.
Got: views that survive a reload, can be bookmarked and shared, and back and forward work.

**No login.** One persona and demo data. It's the first thing to add before real salaries go in.

## Architecture

**Express API plus Next.js, not Next.js alone.**
Gave up: one app, and reading the database straight from server components.
Got: a backend with clear layers (routes, controllers, services, repositories) that can be tested on its own with Supertest, and a frontend that only renders and fetches.

**One Zod schema per rule, shared by the API and the form.**
The form shows the same message the API would send ("Hire date cannot be in the future"), and the rules can't drift apart.
Gave up: the two apps are tied through `packages/shared`, so a schema change touches both. In a monorepo that is one PR.

**Client side data fetching with TanStack Query, no server rendering of data.**
Gave up: the first paint shows a loading state instead of data.
Got: caching, refetch after edits by query key, and pages that are small static shells. An HR tool behind a login doesn't need SEO.

**PostgreSQL, not SQLite.**
Gave up: zero setup to run locally.
Got: `percentile_cont` for medians, check constraints (salary above 0, lower case email), and the same database in tests and on the server. Tests still need no database, since they run on PGlite, a real Postgres in process.

**Business rules in the database where it can hold them.** Unique email, lower case email, salary above 0. The repository turns a unique violation into "email taken", so there's no check-then-insert race.

## Testing

**Real Postgres (PGlite) in tests, no database mocks.**
Gave up: about 3 seconds per package instead of milliseconds.
Got: the SQL itself is tested: search, sort tie breaks, medians, the underpaid query, overflow at large salaries. Insight tests use small hand made fixtures where the expected numbers are worked out by hand.

**Test first, one behaviour per test, plain English titles.** 339 tests. The commit history shows the failing test before each fix.

## Delivery

**Everything on one VPS, on one origin, from one Docker image.**
The web app and the API share `dharmjeet.com/salary-management`, so there's no CORS. One `deploy.sh` ships both, and the VPS's existing setup (Caddy, backups, rollback by image tag) covers it.
Gave up: Vercel's CDN and preview deploys. The image runs as two containers, so it's bigger than either part alone (397 MB).

**Merge commits, not squash.** The log is noisier, but the assessment asks to see how the solution evolved, and every test-then-fix pair stays visible.

## Performance

Measured, not guessed:

| What                 | Number                                   | How                                                                       |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| API on the live site | 110 to 210 ms per call, network included | `curl`, median of 5, from a laptop, for list, search, sort and insights   |
| One search in the UI | 1 API call and 1 page request            | browser resource timing, production build                                 |
| Seed                 | 10,000 employees in about a second       | in the container, batches of 1,000 in one transaction                     |
| All tests            | about 9 seconds                          | `pnpm test`, 339 tests                                                    |
| Docker image         | 397 MB                                   | `docker images`, after moving pnpm's cache out of the layers (was 730 MB) |

What keeps it fast at 10,000:

- **Paging in the database**, 25 rows by default, with the total from one `count` in the same request
- **Indexes for the filters**: `(country, job_title)`, `(country, department)`, `department`, `job_title`. Email is indexed by its unique constraint
- **Insights computed in SQL** (`count`, `avg`, `percentile_cont`) per request, so they're always current after an edit, with no cache to invalidate
- **Search typing is debounced** (300 ms, at least 2 characters), so a word is one request, not one per letter
- **No link prefetching for rows**: Next.js prefetched every row's edit page on every URL change, about 49 requests per search. Turned off, measured at 2

What changes at a bigger scale:

| At                   | Change                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| about 1 million rows | a `pg_trgm` GIN index for search, since `ilike '%asha%'` scans every row                                |
| deep pages           | keyset paging (`where (name, id) > (...)`) instead of `offset`, which reads and drops every earlier row |
| many insight readers | a materialized view refreshed on write, or a short cache, instead of computing medians on every request |
| real use             | salary history in its own table, so edits don't overwrite the past                                      |
