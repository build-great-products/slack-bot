import * as process from 'node:process'
import { z } from 'zod'
import 'dotenv/config'

const $env = z.object({
  DB_PATH: z.string().default('state.db'),
  SLACK_SIGNING_SECRET: z.string(),
  SLACK_BOT_TOKEN: z.string(),
  PORT: z.coerce.number().min(1).default(3000),
})

const env = $env.parse(process.env)

export { env }
