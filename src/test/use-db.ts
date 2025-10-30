import memoize from 'memoize'
import { createFactory } from 'test-fixture-factory'

import type { KyselyDb } from '#src/database.ts'

import { getDb } from '#src/database.ts'
import { getDatabaseUrl } from '#src/env.ts'

// ensure only one instance of the in-memory database for all tests
const getInMemoryDb = memoize(async () => {
  const db = getDb(getDatabaseUrl())
  return db
})

const dbFactory = createFactory<KyselyDb>('DB').fixture(async (_attrs, use) => {
  const db = await getInMemoryDb()
  await use(db)
})

const useDb = dbFactory.useValue

export { useDb }
