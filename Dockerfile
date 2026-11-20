# syntax=docker/dockerfile:1

# One image with the api and the web app. The infra repo's deploy.sh builds it
# on the VPS and compose runs it twice, once per command:
#   docker build --build-arg BUILD_TAG=<commit> -t salary-management:<commit> .
#   api: the default CMD          web: node /web/apps/web/server.js

FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# Install first, so a code change does not reinstall every package
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    --mount=type=cache,id=pnpm-cache,target=/root/.cache/pnpm \
    pnpm install --frozen-lockfile --store-dir /pnpm-store --filter @salary/api... --filter @salary/web...
COPY . .
# The tools directly: `pnpm run` would first re-check the install against
# the default store and try to reinstall
RUN cd apps/api && node_modules/.bin/tsup
# Put into the browser code at build time, so it is a build arg, not runtime env
ARG NEXT_PUBLIC_API_URL=https://dharmjeet.com/salary-management
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && node_modules/.bin/next build

# Only what runs: the api's runtime packages, no tsx, no typescript, and the
# web app's standalone server with the files it traced
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=4000
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
# The package store and pnpm's metadata cache sit in build caches, not in
# the image (about 300MB), and they make the next build's install fast
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    --mount=type=cache,id=pnpm-cache,target=/root/.cache/pnpm \
    pnpm install --frozen-lockfile --prod --store-dir /pnpm-store --filter @salary/api...
COPY --from=build /app/apps/api/dist apps/api/dist
# owned by node, since Next writes its cache next to the server
COPY --from=build --chown=node:node /app/apps/web/.next/standalone /web
COPY --from=build --chown=node:node /app/apps/web/.next/static /web/apps/web/.next/static

ARG BUILD_TAG=dev
ENV BUILD_TAG=$BUILD_TAG
WORKDIR /app/apps/api
USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health >/dev/null || exit 1

# A failed migration stops here, so the api never serves on an old schema.
# exec makes node PID 1, so docker stop's SIGTERM reaches it.
CMD ["sh", "-c", "node dist/migrate.js && exec node dist/server.js"]
