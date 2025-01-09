import * as rough from '@roughapp/sdk'

import { getDb } from './database.ts'
import { migrateToLatest } from './migrate.ts'

import { getDbPath, getPort, getRoughAppUrl, getSlackConfig } from './env.ts'
import { createClient } from './slack/client.ts'

const dbPath = getDbPath()
const db = getDb(dbPath)

const main = async () => {
  rough.client.setConfig({
    baseUrl: getRoughAppUrl(),
  })

  const result = await migrateToLatest(db)
  if (result instanceof Error) {
    console.error(result)
    return
  }

  await createClient({
    db,
    port: getPort(),
    slack: getSlackConfig(),
  })
}

await main()
