import SqliteDatabase from 'better-sqlite3'
import { CamelCasePlugin, Kysely, SqliteDialect } from 'kysely'
import memoize from 'memoize'

type BrandedString<Brand extends string> = string & {
  __brand: Brand
}

type OmitTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'>

type SlackInstallationId = BrandedString<'slackInstallationId'>
type SlackInstallation = {
  id: SlackInstallationId
  value: string
  createdAt: number
  updatedAt: number
}

type SlackWorkspaceId = BrandedString<'slackWorkspaceId'>
type SlackUserId = BrandedString<'slackUserId'>
type SlackUser = {
  slackWorkspaceId: SlackWorkspaceId
  slackUserId: SlackUserId
  slackWorkspaceUrl: string
  roughUserId: string
  roughWorkspaceId: string
  roughWorkspacePublicId: string
  name: string
  accessToken: string
  accessTokenExpiresAt: number
  refreshToken: string
  createdAt: number
  updatedAt: number
}

type SlackUserOauthState = BrandedString<'slackUserOauthState'>
type SlackUserOauth = {
  state: SlackUserOauthState
  slackUserId: SlackUserId
  slackWorkspaceId: SlackWorkspaceId
  slackWorkspaceUrl: string
  codeVerifier: string
  slackResponseUrl: string | null
  createdAt: number
  updatedAt: number
}

type Database = {
  slackInstallation: SlackInstallation
  slackUser: SlackUser
  slackUserOauth: SlackUserOauth
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
  Database,
  KyselyDb,
  OmitTimestamps,
  SlackInstallationId,
  SlackUser,
  SlackUserId,
  SlackUserOauth,
  SlackUserOauthState,
  SlackWorkspaceId,
}
export { getDb }
