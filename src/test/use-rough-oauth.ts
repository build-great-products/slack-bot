import {
  createRoughOAuth2Provider,
  type RoughOAuth2Provider,
} from '@roughapp/sdk'
import { createFactory } from 'test-fixture-factory'

import { getRoughAppUrl } from '#src/env.ts'

import type { Interceptor } from './use-interceptor.ts'

type RoughOAuth2ProviderWithInterceptors = RoughOAuth2Provider & {
  interceptTokens: () => {
    accessToken: string
    refreshToken: string
    expiresInSeconds: number
  }
}

const roughOAuthFactory = createFactory<RoughOAuth2ProviderWithInterceptors>(
  'RoughOAuth',
)
  .withContext<{
    interceptor: Interceptor
  }>()
  .withSchema((f) => ({
    interceptor: f.type<Interceptor>().from('interceptor'),
  }))
  .fixture(async (attrs, use) => {
    const { interceptor } = attrs

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
        .reply(
          200,
          {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: expiresInSeconds,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )

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
  })

const useRoughOAuth = roughOAuthFactory.useValue

export { useRoughOAuth }
