import { createFactory } from 'test-fixture-factory'

const nonceFactory = createFactory<string>('Nonce').fixture(
  async (_attrs, use) => {
    const nonce = (Math.random() * 1000000).toFixed(0)
    await use(nonce)
  },
)

const useNonce = nonceFactory.useValue

export { useNonce }
