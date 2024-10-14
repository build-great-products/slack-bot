import type { Kysely } from 'kysely'

export const name = '2024-10-14-installation-store'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('slack_installation')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('value', 'text', (col) => col.notNull())
    .addColumn('created_at', 'integer', (col) => col.notNull())
    .addColumn('updated_at', 'integer', (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('slack_installation').execute()
}
