const useNonce =
  () =>
  async (
    // biome-ignore lint/correctness/noEmptyPattern: vitest requires {}
    {}: Record<string, unknown>,
    use: (nonce: string) => Promise<void>,
  ) => {
    const nonce = (Math.random() * 1000000).toFixed(0)
    await use(nonce)
  }

export { useNonce }
