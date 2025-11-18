# Base stage
# ------------------------------------------------------------------------------
FROM node:25.2.0-alpine@sha256:3f162243a45e30f6b20f80255779785789e142bec7b1d5d3b431f31d5b3610f6 AS base

# Build stage
# ------------------------------------------------------------------------------
FROM base AS builder

ENV PNPM_HOME=/app/.pnpm \
    PATH=$PNPM_HOME:$PATH

WORKDIR /app
RUN set -ex ;\
  npm install --global --force corepack ;\
  corepack enable ;\
  corepack use pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

# Production stage
# ------------------------------------------------------------------------------
FROM base AS production

WORKDIR /app

# Copy built node modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY src ./src
COPY migrations ./migrations
COPY package.json gmrc.cjs crunchydb.pem docker-app-start.sh ./

# Set the command to run the application
CMD ["./docker-app-start.sh"]
