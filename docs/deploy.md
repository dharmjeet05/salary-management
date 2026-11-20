# Deploy

The web app runs on Vercel. The API and its PostgreSQL run on the VPS, next to the other apps in the private infra repo (`dharmjeet05/infra`). The plan is in [SPEC.md, Part 10](SPEC.md#part-10-deployment).

```
browser ──► Vercel (apps/web)
   │
   └──► https://dharmjeet.com/salary-management/* ──► Caddy ──(proxy network)──► salary-management:4000 ──► salary-management-db
```

Caddy strips `/salary-management`, so the API sees `/api/employees` and `/health`.

## What is where

| File                                        | Repo  | What it does                                        |
| ------------------------------------------- | ----- | --------------------------------------------------- |
| `Dockerfile`                                | this  | builds the API image, runs migrations, then the API |
| `apps/salary-management/docker-compose.yml` | infra | the API and PostgreSQL 18, no published ports       |
| `apps/salary-management/.env.example`       | infra | `POSTGRES_PASSWORD` and `CORS_ORIGIN`               |
| `proxy/caddy/sites/dharmjeet.com.caddy`     | infra | sends `/salary-management/*` to the API             |

## 1. Vercel

1. Add a new project and import `dharmjeet05/salary-management`
2. Root directory: `apps/web`. Vercel finds Next.js and installs from the repo root
3. Environment variables, for Production:
   - `NEXT_PUBLIC_API_URL` = `https://dharmjeet.com/salary-management`
   - `ENABLE_EXPERIMENTAL_COREPACK` = `1`, so the build uses pnpm 11 from `packageManager`
4. Deploy, and note the production url, for example `https://salary-management.vercel.app`

`NEXT_PUBLIC_API_URL` is put into the code at build time. After changing it, redeploy.

## 2. VPS, first time

```bash
# the infra changes (compose, env example, caddy route)
cd /opt/vps/infra && git pull

# this repo is public, so no deploy key
git clone https://github.com/dharmjeet05/salary-management.git /opt/vps/src/salary-management

# secrets: POSTGRES_PASSWORD from `openssl rand -hex 24`, CORS_ORIGIN = the Vercel url
cp /opt/vps/infra/apps/salary-management/.env.example /opt/vps/infra/apps/salary-management/.env
nano /opt/vps/infra/apps/salary-management/.env

# build, start, wait for the health check
/opt/vps/infra/scripts/deploy.sh salary-management

# load the 10,000 employees
docker exec salary-management node dist/seed.js

# turn on the route
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Check:

```bash
curl -sI https://dharmjeet.com/salary-management/health   # 200, X-Build shows the commit
curl -s https://dharmjeet.com/salary-management/api/insights/countries | head -c 200
curl -sI https://dharmjeet.com/                            # the portfolio still answers
```

Then open the Vercel url.

## Later deploys

```bash
/opt/vps/infra/scripts/deploy.sh salary-management             # newest commit on main
/opt/vps/infra/scripts/deploy.sh salary-management <old-tag>   # roll back
```

`deploy.sh` backs up the database before it starts the new image, and the image runs new migrations before it serves.

## Good to know

- `docker exec salary-management node dist/seed.js` replaces every employee with the seeded 10,000. Run it again to reset the demo
- a migration that fails stops the container before it serves. `docker logs salary-management` shows why, and the backup from `deploy.sh` is in `/opt/vps/backups/salary-management`
- `CORS_ORIGIN` takes one origin. Vercel preview urls are not allowed, only production
- `docker stop` lets running requests finish and closes the database pool, so it takes about a second
