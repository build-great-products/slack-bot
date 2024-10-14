import { type Kysely, type MigrationProvider, Migrator } from 'kysely'

import type { Database } from './database.js'

const migrationProvider = {
  getMigrations: async () => {
    return {
      '2024-05-31': await import('./migrations/2024-05-31-init.js'),
      '2024-10-14': await import(
        './migrations/2024-10-14-installation-store.js'
      ),
    }
  },
} satisfies MigrationProvider

const migrateToLatest = async (db: Kysely<Database>) => {
  const migrator = new Migrator({
    db,
    provider: migrationProvider,
  })

  const { error, results } = await migrator.migrateToLatest()

  for (const it of results ?? []) {
    if (it.status === 'Success') {
      console.log(`migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`failed to execute migration "${it.migrationName}"`)
    }
  }

  if (error) {
    console.error('failed to migrate')
    console.error(error)
    process.exit(1)
  }
}

export { migrateToLatest }
