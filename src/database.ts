import SqliteDatabase from 'better-sqlite3'
import { CamelCasePlugin, Kysely, SqliteDialect } from 'kysely'
import memoize from 'memoize'

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

type SlackInstallationId = string & { __brand: 'slackInstallationId' }

type SlackInstallation = {
  id: SlackInstallationId
  value: string
  createdAt: number
  updatedAt: number
}

type Database = {
  slackWorkspace: SlackWorkspace
  slackWorkspaceUser: SlackWorkspaceUser
  slackInstallation: SlackInstallation
}

type KyselyDb = Kysely<Database>

const getDb = memoize((dbPath: string): KyselyDb => {
  return new Kysely({
    dialect: new SqliteDialect({
      database: async () => new SqliteDatabase(dbPath),
    }),
    plugins: [new CamelCasePlugin()],
  })
})

export type {
  OmitTimestamps,
  SlackWorkspaceId,
  UserId,
  Database,
  SlackWorkspace,
  SlackWorkspaceUser,
  SlackInstallationId,
  SlackInstallation,
  KyselyDb,
}
export { getDb }
