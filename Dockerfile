# Base stage
# ------------------------------------------------------------------------------
FROM node:25.5.0-alpine@sha256:f741690269ee7abb07675cb744f0b66ec117b482d89d9565a36f2360d5e2a3ef AS base

# Build stage
# ------------------------------------------------------------------------------
FROM base AS builder

ENV PNPM_HOME=/app/.pnpm \
    PATH=$PNPM_HOME:$PATH

WORKDIR /app
RUN npm install --global pnpm

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
