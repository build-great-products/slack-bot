import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FileMigrationProvider, type Kysely, Migrator } from 'kysely'

import type { Database } from './database.js'

const migrationFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'migrations',
)

const migrateToLatest = async (db: Kysely<Database>) => {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder,
    }),
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
