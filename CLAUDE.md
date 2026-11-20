# CLAUDE.md

Rules for AI agents working in this repo. Humans follow them too.

## Source of truth

- `docs/SPEC.md` is the spec. Read the part the issue links to before writing code.
- If the code needs to differ from the spec, change the spec first, in the same PR, and say why.
- One GitHub issue per task. Build what the issue asks and nothing around it. Ideas for more go in a new issue.

## Stack and versions

- Node 24 LTS (`.nvmrc`), pnpm workspaces, Turborepo.
- TypeScript 6.0. Do not upgrade to 7 until typescript-eslint supports it.
- ESLint 9. ESLint 10 breaks the plugins inside `eslint-config-next`.
- Pin exact versions in `package.json`. Do not add a dependency when a few lines of code do the job.

## Commands

- `pnpm dev` starts the API on 4000 and the web app on 3000
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm format`
- Run all of them before opening a PR. CI runs the same.

## Layers

API (`apps/api/src`):

- `routes/` map URLs to controllers, nothing else
- `controllers/` read the request, call a service, send the response
- `services/` hold business rules. No Express, no SQL
- `repositories/` hold every database query. They return data or null, never HTTP errors
- services throw domain errors from `errors/`, one error middleware maps them to HTTP

Web (`apps/web/src`):

- `app/` pages only compose feature components
- `features/<name>/api` fetch functions, `hooks` TanStack Query hooks with all data logic, `components` render only
- validation uses the Zod schemas from `packages/shared`, never a copy

No extra abstractions without a real need: no DI container, no generic base repository.

## Code

- Strict TypeScript. No `any`, no `as` casts to silence the compiler. Infer types from Zod and Drizzle.
- Comments only for a reason the code cannot show. No narration.
- ASCII only in code.
- Money is an integer in whole units of the employee's currency. Never add amounts in different currencies.

## Tests

- Write the test first when adding behaviour: a failing test commit, then the code that makes it pass.
- Test titles describe behaviour in plain English: `rejects an email that is already used`, not `create works`.
- One behaviour per test. Cover failure paths, not only the happy path.
- Database tests run on PGlite. No mocks for the database.
- Tests must be fast and deterministic: no real clock, no network, no random data without a fixed seed.

## Git

- Branch per issue: `feat/<n>-short-name`, `chore/<n>-...`, `docs/<n>-...`
- Small commits with Conventional Commit titles (`test:`, `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `ci:`)
- PR body says `Closes #<n>`. Merge with a merge commit, never squash, so the history stays visible.
- Log useful prompts and places where AI output was wrong in `docs/ai-usage.md`.
