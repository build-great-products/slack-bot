# Base stage
# ------------------------------------------------------------------------------
FROM node:24.5.0-alpine@sha256:e8e882c692a08878d55ec8ff6c5a4a71b3edca25eda0af4406e2a160d8a93cf2 AS base

# Build stage
# ------------------------------------------------------------------------------
FROM base AS builder

ENV PNPM_HOME=/app/.pnpm \
    PATH=$PNPM_HOME:$PATH

WORKDIR /app
RUN corepack enable && corepack use pnpm

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
