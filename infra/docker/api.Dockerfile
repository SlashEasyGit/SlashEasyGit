# =============================================================================
# tcharts-api  Dockerfile  (multi-stage)
# Target image: < 200 MB
# =============================================================================

# ---- stage 1: deps ----
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /repo

# Copy workspace manifests for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/config/package.json   packages/config/
COPY packages/domain/package.json   packages/domain/
COPY packages/utils/package.json    packages/utils/
COPY packages/contracts/package.json packages/contracts/
COPY packages/ui/package.json       packages/ui/
COPY packages/db/package.json       packages/db/
COPY apps/api/package.json          apps/api/
COPY apps/worker/package.json       apps/worker/
COPY apps/web/package.json          apps/web/

RUN pnpm install --frozen-lockfile

# ---- stage 2: build ----
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /repo
COPY --from=deps /repo /repo
COPY . .

ARG BUILD_SHA=local
ENV BUILD_SHA=${BUILD_SHA}

RUN pnpm --filter @tcharts/db prisma:generate
RUN pnpm --filter @tcharts/api... build

# ---- stage 3: runtime ----
FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9.12.3 --activate
WORKDIR /app

# Non-root user
RUN addgroup -S tcharts && adduser -S tcharts -G tcharts

# Copy only what we need to run
COPY --from=build /repo/apps/api/dist             /app/apps/api/dist
COPY --from=build /repo/apps/api/package.json     /app/apps/api/package.json
COPY --from=build /repo/packages                  /app/packages
COPY --from=build /repo/node_modules              /app/node_modules
COPY --from=build /repo/package.json              /app/package.json

USER tcharts
ENV NODE_ENV=production
EXPOSE 8080

# Healthcheck (ECS uses its own; this is for `docker run` debugging)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O- http://localhost:8080/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
