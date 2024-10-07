import { db } from './database.js'
import { migrateToLatest } from './migrate.js'

import { env } from './env.js'
import { createClient } from './slack/client.js'

await migrateToLatest(db)

await createClient({
  db,
  slackSigningSecret: env.SLACK_SIGNING_SECRET,
  slackBotToken: env.SLACK_BOT_TOKEN,
  port: env.PORT,
})
