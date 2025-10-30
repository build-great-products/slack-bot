import { createFactory } from 'test-fixture-factory'
import { vi } from 'vitest'

const nowFactory = createFactory<number>('Now')
  .withSchema((f) => ({
    now: f.type<number>().default(() => Date.now()),
  }))
  .fixture(async (attrs, use) => {
    const { now } = attrs
    vi.setSystemTime(now)
    await use(now)
  })

const useNow = nowFactory.useValue

export { useNow }
