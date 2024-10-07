import SqliteDatabase from 'better-sqlite3'
import { CamelCasePlugin, Kysely, SqliteDialect } from 'kysely'

import { env } from './env.js'

type SlackWorkspaceId = string & { __brand: 'slackWorkspaceId' }
type UserId = string & { __brand: 'userId' }

type OmitTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>

type SlackWorkspace = {
  id: SlackWorkspaceId
  roughWorkspaceId: string
  roughWorkspacePublicId: string
  apiToken: string
  name: string
  createdAt: number
  updatedAt: number
  url: string
}

type SlackWorkspaceUser = {
  slackWorkspaceId: SlackWorkspaceId
  userId: UserId
  roughUserId: string
  name: string
  createdAt: number
  updatedAt: number
}

type Database = {
  slackWorkspace: SlackWorkspace
  slackWorkspaceUser: SlackWorkspaceUser
}

type KyselyDb = Kysely<Database>

const db: KyselyDb = new Kysely({
  dialect: new SqliteDialect({
    database: async () => new SqliteDatabase(env.DB_PATH),
  }),
  plugins: [new CamelCasePlugin()],
})

export type {
  OmitTimestamps,
  SlackWorkspaceId,
  UserId,
  Database,
  SlackWorkspace,
  SlackWorkspaceUser,
  KyselyDb,
}
export { db }
