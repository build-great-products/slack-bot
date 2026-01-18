# Provide access to local Node module binaries, and makes just recipe commands
# behave more like script entries in Node.js package.json files:
export PATH := "./node_modules/.bin:" + env_var('PATH')

# Load environment variables from .env file

set dotenv-load := true

# Modules

mod db

# Commands

update:
    pnpm update --latest

test:
  vitest

test-coverage:
  vitest --run --coverage

check:
  tsc --noEmit

lint:
  biome check

fix:
  biome check --write --unsafe

knip:
  knip

watch:
  node --env-file=.env --watch ./src/index.ts

start:
  node --env-file=.env ./src/index.ts
