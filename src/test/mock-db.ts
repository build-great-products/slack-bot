import { createFactory } from 'test-fixture-factory'

import type { KyselyDb } from '#src/database.ts'

const mockDbFactory = createFactory<KyselyDb>('MockDB').fixture(
  async (_attrs, use) => {
    const db = 'MOCK_DB' as unknown as KyselyDb

    await use(db)
  },
)

const mockDb = mockDbFactory.useValue

export { mockDb }
