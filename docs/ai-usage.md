# How AI was used

The whole project was built with an AI coding agent, on purpose. This page covers how the work was set up so the agent stayed correct, and the places where it was wrong and how that was caught.

## Tools

- **Claude Code** (Claude Opus 5.5) in the Claude desktop app: wrote the spec draft, the code, the tests, the PR descriptions and the PR reviews. Every commit it made says so in a `Co-Authored-By` line
- **Three of Dharmjeet's own Claude Code skills**, saved prompts the agent loads on demand:
  - a task skill, which turns an issue into a short checklist of rules that apply to it, before any code
  - a PR description skill: summary, evidence and "merge danger" (what breaks, and for whom, if the PR is wrong)
  - a deep review skill: it explains the PR (problem, approach, alternatives, impact outside the diff), then lists numbered findings and changes nothing until told which to fix
- **The in-app browser**, to click through every feature against the real API with the seeded 10,000, and to count network requests
- **GitHub CLI**, for issues, PRs, review comments and merges. **Docker**, to run the real image behind Caddy locally before the VPS

## Who decided what

Dharmjeet set the direction and made every product and design call. The agent proposed, built and checked. Some of the calls that came from Dharmjeet, not the agent:

- the stack, the monorepo, the layer structure, and "logic in hooks" on the frontend
- spec driven: one spec as the single source of truth, and every task a public GitHub issue
- review comments go on the PR first, then Dharmjeet picks which ones to fix
- salary sort only inside one country, since salaries are in different currencies
- `Controller` fields for the form
- everything on the VPS on one origin, instead of the web app on Vercel
- two bugs found on the live site: names that repeated, and too many requests in the network tab

## The loop for every task

1. **Spec first.** [SPEC.md](SPEC.md) was the first commit, with the one page requirements. When the code had to differ, the spec changed in the same PR
2. **Rules the agent reads every time.** [CLAUDE.md](../CLAUDE.md) pins the stack versions, the layer rules, "test first", "no `as` casts", plain English test titles, and the git flow
3. **An issue per task**, with a checklist made by the task skill (for example "no number or bar ever puts two currencies side by side")
4. **Test first.** A failing test commit, then the code. 42 of the 162 commits are test commits. To check a test can fail, the agent often removed the fix, saw the test go red, and put it back
5. **Check it for real.** Run it in a browser against the real API, or the Docker image behind Caddy. Typecheck passing doesn't show the screen works
6. **A deep review on every PR**, with the findings posted as PR comments before any fix. 36 review comments over 17 PRs. The ones Dharmjeet picked were fixed in their own commits, then replied to and resolved
7. **Merge with a merge commit**, so the history keeps every step

## Where the AI was wrong, and how it was caught

Most mistakes were caught by the process, not by luck: the review on each PR, running the real thing, or a test that had to fail first.

### Caught by the review on the PR

| PR  | What was wrong                                                                                           | Fix                                                                      |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| #18 | "Today" was the UTC day, so a hire date of today failed in India for 5.5 hours every night               | the latest allowed date is today in the furthest ahead time zone, UTC+14 |
| #18 | a missing name showed Zod's own wording, "Invalid input: expected string, received undefined"            | a plain message per field, "Enter a name"                                |
| #19 | the unique email was case sensitive, so `Asha@acme.test` and `asha@acme.test` could both exist           | emails stored in lower case, with a database check                       |
| #19 | the database pool had no `error` listener, so a dropped idle connection would crash the API              | a listener that logs it                                                  |
| #20 | a trailing slash in `CORS_ORIGIN` silently broke CORS                                                    | the env check keeps only the origin                                      |
| #21 | a test that could not fail                                                                               | rewritten so it fails without the code                                   |
| #23 | an id above what Postgres can hold gave a 500 instead of a 400                                           | the id schema stops at 2,147,483,647                                     |
| #24 | the seed spread pay ±15%, so nobody was ever underpaid and the underpaid insight was always empty        | about 3% of people paid 60 to 78% of their band                          |
| #25 | `percentOfMedian` multiplied a salary by 100 inside an integer, which overflows for large salaries       | `100.0 *`, so Postgres works in numeric                                  |
| #27 | a letter typed while the URL caught up with the search box was erased                                    | compare with the last pushed search text, not the URL                    |
| #27 | "Clear filters" also reset the sort and the page size                                                    | it keeps them                                                            |
| #28 | after saving, the list lost its filters                                                                  | a `?from=` return path, checked to stay inside the app                   |
| #29 | while a new country loaded, its name showed above the old country's numbers                              | old data is kept only for a threshold change in the same country         |
| #36 | a code comment said hover still prefetches with `prefetch={false}`. A production build showed it doesn't | the comment and the PR text corrected                                    |

### Caught by running it for real

- **Caddy config** (#32): `handle /salary-management /salary-management/*` looked right but doesn't parse, since `handle` takes one path. The local Caddy refused to start. A named matcher fixed it, and `caddy validate` passed on the real infra config
- **Image size** (#30): the first image was 730 MB, because pnpm's cache was baked into a layer. Build cache mounts brought it to 341 MB
- **Insights after an edit** (#29): raising a salary from the underpaid list didn't take the person off it, because only the employee list was refreshed. Found while clicking through, fixed by refreshing insights too
- **Versions**: ESLint 10 broke the plugins inside `eslint-config-next`, and TypeScript 7 isn't supported by typescript-eslint yet. Both pinned one major back, with the reason in `CLAUDE.md`
- **pnpm safety settings**: when a package was too new for pnpm's `minimumReleaseAge`, the agent's install added exclusions to the config. Reverted, and older versions pinned instead

### Caught by Dharmjeet

- **Repeated names** (#33): each country had 16 × 16 name pairs, so India's 3,500 people shared about 256 names. The seed tests checked emails were unique, not names. Now a test checks 10,000 different full names
- **Request flood** (#34): one search fired about 49 requests. They weren't API calls but Next.js prefetching every row's edit page, again on every URL change. Measured before and after in a production build: 49 down to 2

## What worked

- **A spec the agent reads every time** kept 17 PRs consistent: the same error shape, the same layer rules, the same money rules
- **Test first** made the agent's claims checkable. "Fixed" meant a red test turned green
- **A review that explains before it judges** caught real bugs in almost every PR, and kept the decision with a person
- **Running the real thing** (browser, Docker, Caddy) caught what types and unit tests can't: config syntax, image size, request counts
- **What still needed a human:** product judgement (sort only inside a country, VPS over Vercel), and noticing things that look wrong to a user, like repeated names
