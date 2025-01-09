import memoize from 'memoize'
import { defineFactory } from 'test-fixture-factory'

import type { KyselyDb } from '#src/database.ts'

import { getDb } from '#src/database.ts'
import { migrateToLatest } from '#src/migrate.ts'

// ensure only one instance of the in-memory database for all tests
const getInMemoryDb = memoize(async () => {
  const db = getDb(':memory:')
  await migrateToLatest(db)
  return db
})

const dbFactory = defineFactory<
  Record<string, unknown>, // no deps
  void, // no attributes
  KyselyDb // returns adb instance
>(
  async (
    // biome-ignore lint/correctness/noEmptyPattern: vitest requires {}
    {}: Record<string, unknown>,
    _attrs,
  ) => {
    const db = await getInMemoryDb()
    return {
      value: db,
    }
  },
)

const useDb = dbFactory.useValueFn

export { useDb }
