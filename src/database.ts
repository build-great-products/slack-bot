import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely'
import memoize from 'memoize'
import pg from 'pg'

import type Database from './__generated__/kanel/Database.ts'

type OmitTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>

type KyselyDb = Kysely<Database>

// bigint → number
pg.types.setTypeParser(20, (val) => {
  return Number.parseInt(val, 10)
})

const getDb = memoize((dbPath: string): KyselyDb => {
  return new Kysely({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString: dbPath,
      }),
    }),
    plugins: [new CamelCasePlugin()],
  })
})

export type { Database, KyselyDb, OmitTimestamps }

export type {
  SlackInstallationId,
  SlackInstallation,
  SlackUser,
  SlackUserOauth,
  SlackUserOauthState,
  SlackUserSlackUserId as SlackUserId,
  SlackUserSlackWorkspaceId as SlackWorkspaceId,
} from './__generated__/kanel/index.ts'

export { getDb }
