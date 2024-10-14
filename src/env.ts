import * as process from 'node:process'
import memoize from 'memoize'
import { z } from 'zod'
import 'dotenv/config'

const getSlackConfig = memoize(() => {
  const $env = z.object({
    SLACK_CLIENT_ID: z.string(),
    SLACK_CLIENT_SECRET: z.string(),
    SLACK_SIGNING_SECRET: z.string(),
    SLACK_STATE_SECRET: z.string(),
  })
  const config = $env.parse(process.env)
  return {
    clientId: config.SLACK_CLIENT_ID,
    clientSecret: config.SLACK_CLIENT_SECRET,
    signingSecret: config.SLACK_SIGNING_SECRET,
    stateSecret: config.SLACK_STATE_SECRET,
  }
})

const getDbPath = memoize(() => {
  const $env = z.object({
    DB_PATH: z.string().default('state.db'),
  })
  return $env.parse(process.env).DB_PATH
})

const getPort = memoize(() => {
  const $env = z.object({
    PORT: z.coerce.number().min(1).default(3000),
  })
  return $env.parse(process.env).PORT
})

export { getSlackConfig, getDbPath, getPort }
