import * as process from 'node:process'
import { z } from 'zod'
import 'dotenv/config'

const $env = z.object({
  DB_PATH: z.string().default('state.db'),
  SLACK_CLIENT_ID: z.string(),
  SLACK_CLIENT_SECRET: z.string(),
  SLACK_SIGNING_SECRET: z.string(),
  SLACK_STATE_SECRET: z.string(),
  PORT: z.coerce.number().min(1).default(3000),
})

const env = $env.parse(process.env)

export { env }
