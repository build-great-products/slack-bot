#!/usr/bin/env sh

set -eux

# run database migrations
./node_modules/.bin/graphile-migrate migrate --config ./gmrc.cjs

exec node --no-warnings --experimental-strip-types ./src/index.ts
