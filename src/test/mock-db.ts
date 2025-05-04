import { defineFactory } from 'test-fixture-factory'

import type { KyselyDb } from '#src/database.ts'

const dbFactory = defineFactory<
  Record<string, unknown>, // no deps
  void, // no attributes
  KyselyDb // returns a (mocked) db instance
>(
  (
    // biome-ignore lint/correctness/noEmptyPattern: vitest requires {}
    {}: Record<string, unknown>,
    _attrs,
  ) => {
    const db = 'MOCK_DB' as unknown as KyselyDb

    return {
      value: db,
    }
  },
)

const mockDb = dbFactory.useValueFn

export { mockDb }
