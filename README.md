# Salary Management

A web app for ACME's HR manager to manage salary data for 10,000 employees across countries and see how the company pays people.

The plan, scope and design are in [docs/SPEC.md](docs/SPEC.md). Progress is tracked in [GitHub issues](https://github.com/dharmjeet05/salary-management/issues).

## Run locally

Needs Node 24 (`nvm use`), pnpm and a PostgreSQL database.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp packages/db/.env.example packages/db/.env
pnpm --filter @salary/db db:migrate
pnpm dev
```

Set `DATABASE_URL` in `apps/api/.env` and `packages/db/.env` to your database.

API on http://localhost:4000, web app on http://localhost:3000.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
