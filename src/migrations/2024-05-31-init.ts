import type { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('slack_workspace')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('rough_workspace_id', 'text', (col) => col.notNull())
    .addColumn('rough_workspace_public_id', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('api_token', 'text', (col) => col.notNull())
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull())
    .addColumn('updated_at', 'integer', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('slack_workspace_user')
    .addColumn('slack_workspace_id', 'text', (col) => col.notNull())
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('rough_user_id', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull())
    .addColumn('updated_at', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint(
      'slack_workspace_user:primaryKey(slack_workspace_id,user_id)',
      ['slack_workspace_id', 'user_id'],
    )
    .addForeignKeyConstraint(
      'slack_workspace_user:foreignKey(guid_id,slack_workspace.id)',
      ['slack_workspace_id'],
      'slack_workspace',
      ['id'],
    )
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('slack_workspace_user').execute()
  await db.schema.dropTable('slack_workspace').execute()
}
