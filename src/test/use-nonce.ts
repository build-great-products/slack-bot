import { defineFactory } from 'test-fixture-factory'

const nonceFactory = defineFactory<
  Record<string, unknown>, // no deps
  void, // no attributes
  string // returns a nonce
>(
  async (
    // biome-ignore lint/correctness/noEmptyPattern: vitest requires {}
    {}: Record<string, unknown>,
    _attrs,
  ) => {
    const nonce = (Math.random() * 1000000).toFixed(0)
    return {
      value: nonce,
    }
  },
)

const useNonce = nonceFactory.useValueFn

export { useNonce }
