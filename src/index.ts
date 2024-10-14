import { getDb } from './database.js'
import { migrateToLatest } from './migrate.js'

import { getDbPath, getPort, getSlackConfig } from './env.js'
import { createClient } from './slack/client.js'

const dbPath = getDbPath()
const db = getDb(dbPath)

await migrateToLatest(db)

await createClient({
  db,
  port: getPort(),
  slack: getSlackConfig(),
})
