# Deploy

Everything runs on the VPS, next to the other apps in the private infra repo (`dharmjeet05/infra`), on one origin. The plan is in [SPEC.md, Part 10](SPEC.md#part-10-deployment).

- web app: https://dharmjeet.com/salary-management
- API: https://dharmjeet.com/salary-management/api/...

```
browser ──► https://dharmjeet.com ──► Caddy ──(proxy network)──┬──► /salary-management/api/*  salary-management:4000 ──► salary-management-db
                                                                ├──► /salary-management/*      salary-management-web:3000
                                                                └──► everything else           dharmjeet-web:3000 (portfolio)
```

Caddy strips `/salary-management` for the API, so it sees `/api/employees`. The web app keeps the prefix, since Next.js runs with `basePath: '/salary-management'`.

## What is where

| File                                        | Repo  | What it does                                                          |
| ------------------------------------------- | ----- | --------------------------------------------------------------------- |
| `Dockerfile`                                | this  | one image with the API and the web app. The API runs migrations first |
| `apps/salary-management/docker-compose.yml` | infra | the API, the web app (same image, other command) and PostgreSQL 18    |
| `apps/salary-management/.env.example`       | infra | `POSTGRES_PASSWORD`                                                   |
| `proxy/caddy/sites/dharmjeet.com.caddy`     | infra | the two `/salary-management` routes                                   |

## First time

```bash
# the infra changes (compose, env example, caddy routes)
cd /opt/vps/infra && git pull

# this repo is public, so no deploy key
git clone https://github.com/dharmjeet05/salary-management.git /opt/vps/src/salary-management

# the database password: paste the output of `openssl rand -hex 24`
cp /opt/vps/infra/apps/salary-management/.env.example /opt/vps/infra/apps/salary-management/.env
nano /opt/vps/infra/apps/salary-management/.env

# build, start both containers, wait for the API health check
/opt/vps/infra/scripts/deploy.sh salary-management

# load the 10,000 employees
docker exec salary-management node dist/seed.js

# turn on the routes
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Check:

```bash
docker compose -f /opt/vps/infra/apps/salary-management/docker-compose.yml ps   # all three healthy
curl -sI https://dharmjeet.com/salary-management/api/meta   # 200, X-Build shows the commit
curl -sI https://dharmjeet.com/salary-management            # 307 to /salary-management/employees
curl -sI https://dharmjeet.com/                             # the portfolio still answers
```

Then open https://dharmjeet.com/salary-management.

## Later deploys

```bash
/opt/vps/infra/scripts/deploy.sh salary-management             # newest commit on main
/opt/vps/infra/scripts/deploy.sh salary-management <old-tag>   # roll back
```

`deploy.sh` backs up the database, then starts the new image for both containers. It waits for the API's health check only, so look at `ps` above for the web container.

## Good to know

- `docker exec salary-management node dist/seed.js` replaces every employee with the seeded 10,000. Run it again to reset the demo
- a migration that fails stops the API container before it serves. `docker logs salary-management` shows why, and the backup from `deploy.sh` is in `/opt/vps/backups/salary-management`
- the API url goes into the web code at build time, as the `NEXT_PUBLIC_API_URL` build arg (default `https://dharmjeet.com/salary-management`). To test the image elsewhere, build with `--build-arg NEXT_PUBLIC_API_URL=...`
- `/health` is not under `/api`, so it is not public. Only the health check inside the container calls it
- the web app and the API share an origin, so CORS never comes into play. `CORS_ORIGIN` defaults to `https://dharmjeet.com` in compose
