# Base stage
# ------------------------------------------------------------------------------
FROM node:25.1.0-alpine@sha256:07e85fae850fe8544714ea3cf320a30ed9005d4e9baaa3ef7e1cb92227659dbb AS base

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
