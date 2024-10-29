import { errorBoundary } from '@stayradiated/error-boundary'
import { type Kysely, type MigrationProvider, Migrator } from 'kysely'

import type { Database } from './database.ts'

const loadMigrations = async (
  importList: Promise<{
    name: string
    up: (db: Kysely<unknown>) => Promise<void>
    down: (db: Kysely<unknown>) => Promise<void>
  }>[],
) => {
  return Object.fromEntries(
    (await Promise.all(importList)).map((file) => [file.name, file]),
  )
}

const migrationProvider = {
  getMigrations: () =>
    loadMigrations([
      import('./migrations/2024-10-14-installation-store.ts'),
      import('./migrations/2024-10-26-user-access-token.ts'),
    ]),
} satisfies MigrationProvider

const migrateToLatest = (db: Kysely<Database>) => {
  return errorBoundary(async () => {
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
      return error
    }
  })
}

export { migrateToLatest }
