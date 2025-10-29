# Base stage
# ------------------------------------------------------------------------------
FROM node:25.0.0-alpine@sha256:bce79c648e05d584ad9ae2b45ed663ae6f07ebfa9e5fe6f5b7f0165aca06e792 AS base

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
