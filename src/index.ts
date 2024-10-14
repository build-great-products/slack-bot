import { getDb } from './database.js'
import { migrateToLatest } from './migrate.js'

import { env } from './env.js'
import { createClient } from './slack/client.js'

const db = getDb()

await migrateToLatest(db)

await createClient({
  db,
  slackClientId: env.SLACK_CLIENT_ID,
  slackClientSecret: env.SLACK_CLIENT_SECRET,
  slackSigningSecret: env.SLACK_SIGNING_SECRET,
  slackStateSecret: env.SLACK_STATE_SECRET,
  port: env.PORT,
})
