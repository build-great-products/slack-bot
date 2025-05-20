# Base stage
# ------------------------------------------------------------------------------
FROM node:24.0.2-alpine@sha256:2e6c7937cb36d1e4af3c261b29e862205beb7a409de01f12b6df34800cc108ec AS base

# Build stage
# ------------------------------------------------------------------------------
FROM base AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ 

ENV PNPM_HOME=/app/.pnpm \
    PATH=$PNPM_HOME:$PATH

WORKDIR /app
RUN corepack enable && corepack use pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

# Copy source code
COPY ./src ./src/

# Production stage
# ------------------------------------------------------------------------------
FROM base AS production

WORKDIR /app

# Copy built node modules and source code from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

# Set the command to run the application
CMD ["node", "--no-warnings", "--experimental-strip-types", "./src/index.ts"]
