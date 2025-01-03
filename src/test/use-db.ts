import memoize from 'memoize'

import type { KyselyDb } from '#src/database.ts'

import { getDb } from '#src/database.ts'
import { migrateToLatest } from '#src/migrate.ts'

// ensure only one instance of the in-memory database for all tests
const getInMemoryDb = memoize(async () => {
  const db = getDb(':memory:')
  await migrateToLatest(db)
  return db
})

const useDb = () => {
  return async (
    // biome-ignore lint/correctness/noEmptyPattern: vitest requires {}
    {}: Record<string, unknown>,
    use: (db: KyselyDb) => Promise<void>,
  ) => {
    const db = await getInMemoryDb()
    await use(db)
  }
}

export { useDb }
