# syntax=docker/dockerfile:1

# The api image. The infra repo's deploy.sh builds it on the VPS:
#   docker build --build-arg BUILD_TAG=<commit> -t salary-management:<commit> .
# The web app is not in it, it runs on Vercel.

FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# Install first, so a code change does not reinstall every package
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
    --mount=type=cache,id=pnpm-cache,target=/root/.cache/pnpm \
    pnpm install --frozen-lockfile --store-dir /pnpm-store --filter @salary/api...
COPY . .
# tsup directly: `pnpm run` would first re-check the install against the
# default store and try to reinstall
RUN cd apps/api && node_modules/.bin/tsup

# Only the packages the bundle imports at runtime: no tsx, no typescript
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
