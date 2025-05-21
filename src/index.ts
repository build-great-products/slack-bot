import * as rough from '@roughapp/sdk'

import { getDb } from './database.ts'

import {
  getDatabaseUrl,
  getPort,
  getRoughAppUrl,
  getSlackConfig,
} from './env.ts'
import { createClient } from './slack/client.ts'

const dbPath = getDatabaseUrl()
const db = getDb(dbPath)

const main = async () => {
  rough.client.setConfig({
    baseUrl: getRoughAppUrl(),
  })

  await createClient({
    db,
    port: getPort(),
    slack: getSlackConfig(),
  })
}

await main()
