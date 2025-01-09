import { defineFactory } from 'test-fixture-factory'
import { vi } from 'vitest'

const nowFactory = defineFactory<
  Record<string, unknown>, // no deps
  // biome-ignore lint/suspicious/noConfusingVoidType: allow optional attrs
  void | { now: number },
  number // returns a nonce
>(
  async (
    // biome-ignore lint/correctness/noEmptyPattern: vitest requires {}
    {}: Record<string, unknown>,
    attrs,
  ) => {
    const { now = Date.now() } = attrs ?? {}
    vi.setSystemTime(now)
    return {
      value: now,
    }
  },
)

const useNow = nowFactory.useValueFn

export { useNow }
