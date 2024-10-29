import type { Kysely } from 'kysely'

type Database = {
  slackWorkspaceUser: {
    accessToken: string
    accessTokenExpiresAt: number
    refreshToken: string
  }
}

export const name = '2024-10-26-user-access-token'

export const up = (anyDb: Kysely<unknown>): Promise<void> => {
  // override the type to include the new columns
  const db = anyDb as Kysely<Database>

  return db.transaction().execute(async (db) => {
    await db.schema
      .createTable('slack_user')
      .addColumn('slack_workspace_id', 'text', (col) => col.notNull())
      .addColumn('slack_user_id', 'text', (col) => col.notNull())
      .addColumn('slack_workspace_url', 'text', (col) => col.notNull())
      .addColumn('rough_user_id', 'text', (col) => col.notNull())
      .addColumn('rough_workspace_id', 'text', (col) => col.notNull())
      .addColumn('rough_workspace_public_id', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('access_token', 'text', (col) => col.notNull())
      .addColumn('access_token_expires_at', 'integer', (col) => col.notNull())
      .addColumn('refresh_token', 'text', (col) => col.notNull())
      .addColumn('created_at', 'integer', (col) => col.notNull())
      .addColumn('updated_at', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint(
        'slack_user:primaryKey(slack_workspace_id,slack_user_id)',
        ['slack_workspace_id', 'slack_user_id'],
      )
      .execute()

    await db.schema
      .createTable('slack_user_oauth')
      .addColumn('state', 'text', (col) => col.primaryKey())
      .addColumn('slack_user_id', 'text', (col) => col.notNull())
      .addColumn('slack_workspace_id', 'text', (col) => col.notNull())
      .addColumn('slack_workspace_url', 'text', (col) => col.notNull())
      .addColumn('code_verifier', 'text', (col) => col.notNull())
      .addColumn('slack_response_url', 'text')
      .addColumn('created_at', 'integer', (col) => col.notNull())
      .addColumn('updated_at', 'integer', (col) => col.notNull())
      .execute()
  })
}

export const down = (db: Kysely<unknown>): Promise<void> => {
  return db.transaction().execute(async (db) => {
    await db.schema.dropTable('slack_user').execute()
    await db.schema.dropTable('slack_user_oauth').execute()
  })
}
