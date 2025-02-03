FROM node:23.7.0-alpine AS base
ENV PNPM_HOME=/app/.pnpm \
    PATH=$PNPM_HOME:$PATH

WORKDIR /app
RUN corepack enable && corepack use pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

COPY ./src ./src/
CMD ["node", "--no-warnings", "--experimental-strip-types", "./src/index.ts"]
