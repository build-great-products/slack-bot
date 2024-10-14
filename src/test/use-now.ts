import { vi } from 'vitest'

const useNow =
  (now: number = Date.now()) =>
  async (
    // biome-ignore lint/correctness/noEmptyPattern: vitest requires {}
    {}: Record<string, unknown>,
    use: (now: number) => Promise<void>,
  ) => {
    vi.setSystemTime(now)
    await use(now)
  }

export { useNow }
