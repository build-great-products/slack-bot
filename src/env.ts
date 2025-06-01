import * as process from 'node:process'
import memoize from 'memoize'
import { z } from 'zod/v4'
import 'dotenv/config'

const getOriginUrl = memoize(() => {
  const $env = z.object({
    ORIGIN: z.string(),
  })
  return $env.parse(process.env).ORIGIN
})

const getRoughAppUrl = memoize(() => {
  const $env = z.object({
    ROUGH_APP_URL: z.string().default('https://in.rough.app'),
  })
  return $env.parse(process.env).ROUGH_APP_URL
})

const getRoughConfig = memoize(() => {
  const $env = z.object({
    ROUGH_CLIENT_ID: z.string(),
    ROUGH_CLIENT_SECRET: z.string(),
  })
  const config = $env.parse(process.env)
  return {
    clientId: config.ROUGH_CLIENT_ID,
    clientSecret: config.ROUGH_CLIENT_SECRET,
  }
})

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

const getDatabaseUrl = memoize(() => {
  const $env = z.object({
    DATABASE_URL: z.url(),
  })
  return $env.parse(process.env).DATABASE_URL
})

const getPort = memoize(() => {
  const $env = z.object({
    PORT: z.coerce.number().min(1).default(3000),
  })
  return $env.parse(process.env).PORT
})

export {
  getOriginUrl,
  getRoughAppUrl,
  getRoughConfig,
  getSlackConfig,
  getDatabaseUrl,
  getPort,
}
