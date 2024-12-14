import {
  type RoughOAuth2Provider,
  createRoughOAuth2Provider,
} from '@roughapp/sdk'

import { getRoughAppUrl } from '#src/env.ts'

import type { Interceptor } from './use-interceptor.ts'

type RoughOAuth2ProviderWithInterceptors = RoughOAuth2Provider & {
  interceptTokens: () => {
    accessToken: string
    refreshToken: string
    expiresInSeconds: number
  }
}

const useRoughOAuth =
  () =>
  async (
    { interceptor }: { interceptor: Interceptor },
    use: (roughOAuth: RoughOAuth2ProviderWithInterceptors) => Promise<void>,
  ): Promise<void> => {
    const roughOAuth = createRoughOAuth2Provider({
      baseUrl: getRoughAppUrl(),
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://internal/callback',
    })

    const interceptTokens = () => {
      const nonce = (Math.random() * 1000000).toFixed(0)
      const accessToken = `xxx.access.token.xxx.${nonce}`
      const refreshToken = `xxx.access.token.xxx.${nonce}`
      const expiresInSeconds = 60

      interceptor(getRoughAppUrl())
        .intercept({
          method: 'POST',
          path: '/api/v1/oauth2/token',
        })
        .reply(200, {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresInSeconds,
        })

      return {
        accessToken,
        refreshToken,
        expiresInSeconds,
      }
    }

    await use({
      ...roughOAuth,
      interceptTokens,
    })
  }

export { useRoughOAuth }
