FROM node:23.0.0-alpine AS base
ENV PNPM_HOME=/app/.pnpm \
    PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN corepack enable && corepack use pnpm

FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN set -e; \
  mkdir -p $PNPM_HOME; \
  pnpm install
COPY . ./
RUN pnpm run build

FROM base AS runner
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
COPY --from=builder /app/dist /app/dist/
WORKDIR /app/dist
CMD ["node", "index.js"]
