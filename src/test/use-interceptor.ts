import type { Interceptable as GlobalAgent } from 'undici'
import { MockAgent, setGlobalDispatcher } from 'undici'

import { once } from '#src/utils/once.ts'

const getGlobalMockAgent = once(() => {
  const agent = new MockAgent()
  agent.disableNetConnect()
  setGlobalDispatcher(agent)
  return agent
})

/*
 * really useful for testing api calls
 *
 * const test = anyTest.extend({
 *   agent: useGlobalAgent('https://example.com'),
 * })
 *
 * test('should fetch data', async ({ agent }) => {
 *   mock.intercept({ method: 'GET', path: '/api' }).reply(200, 'hello world')
 *
 *   const response = await fetch('https://example.com/api')
 *   const data = await response.text()
 *   console.log(data) // 'hello world'
 * })
 */

type Interceptor = (origin: string) => GlobalAgent

const useInterceptor =
  () =>
  async (
    // biome-ignore lint/correctness/noEmptyPattern: vitest requires {}
    {}: Record<string, unknown>,
    use: (interceptor: Interceptor) => Promise<void>,
  ) => {
    const globalMockAgent = getGlobalMockAgent()

    const agentSet = new Set<GlobalAgent>()

    const interceptor = (origin: string) => {
      const agent = globalMockAgent.get(origin)
      agentSet.add(agent)
      return agent
    }

    await use(interceptor)

    globalMockAgent.assertNoPendingInterceptors()

    for (const agent of agentSet) {
      await agent.destroy()
    }
  }

export type { Interceptor }
export { useInterceptor }
