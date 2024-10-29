import { errorBoundary } from '@stayradiated/error-boundary'
import { createS256CodeChallenge } from 'arctic/dist/oauth2.js'
import {
  createOAuth2Request as arcticCreateOAuth2Request,
  sendTokenRequest,
  sendTokenRevocationRequest,
} from 'arctic/dist/request.js'

import { getRoughAppUrl } from '#src/env.ts'

const createOAuth2Request = (
  endpoint: string,
  body: URLSearchParams,
  origin: string,
): Request => {
  const request = arcticCreateOAuth2Request(endpoint, body)
  // must set origin header for SvelteKit to allow POST requests with form data
  request.headers.set('origin', origin)
  return request
}

type OAuth2Tokens = {
  accessToken: string
  accessTokenExpiresAt: number
  refreshToken: string
}

type RoughOAuth2Provider = {
  createAuthorizationURL(
    state: string,
    codeVerifier: string,
    scopes: string[],
  ): URL
  validateAuthorizationCode(
    code: string,
    codeVerifier: string,
  ): Promise<OAuth2Tokens | Error>
  refreshAccessToken(refreshToken: string): Promise<OAuth2Tokens | Error>
  revokeToken(
    tokenType: 'access_token' | 'refresh_token',
    token: string,
  ): Promise<undefined | Error>
}

type CreateRoughOAuth2ProviderOptions = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

const createRoughOAuth2Provider = (
  options: CreateRoughOAuth2ProviderOptions,
) => {
  const { clientId, clientSecret, redirectUri } = options

  const origin = getRoughAppUrl()
  const authorizationEndpoint = `${origin}/api/v1/oauth2/authorize`
  const tokenEndpoint = `${origin}/api/v1/oauth2/token`
  const tokenRevocationEndpoint = `${origin}/api/v1/oauth2/token/revoke`

  const roughOAuth2Provider: RoughOAuth2Provider = {
    createAuthorizationURL: (state, codeVerifier, scopes) => {
      const url = new URL(authorizationEndpoint)
      url.searchParams.set('response_type', 'code')
      url.searchParams.set('client_id', clientId)
      url.searchParams.set('state', state)
      url.searchParams.set('scope', scopes.join(' '))
      url.searchParams.set('redirect_uri', redirectUri)
      const codeChallenge = createS256CodeChallenge(codeVerifier)
      url.searchParams.set('code_challenge_method', 'S256')
      url.searchParams.set('code_challenge', codeChallenge)
      return url
    },

    validateAuthorizationCode: (code, codeVerifier) => {
      return errorBoundary(async () => {
        const body = new URLSearchParams()
        body.set('grant_type', 'authorization_code')
        body.set('code', code)
        body.set('code_verifier', codeVerifier)
        body.set('redirect_uri', redirectUri)
        body.set('client_id', clientId)
        body.set('client_secret', clientSecret)
        const request = createOAuth2Request(tokenEndpoint, body, origin)
        const tokens = await sendTokenRequest(request)

        return {
          accessToken: tokens.accessToken(),
          accessTokenExpiresAt: tokens.accessTokenExpiresAt().getTime(),
          refreshToken: tokens.refreshToken(),
        }
      })
    },

    refreshAccessToken: (refreshToken) => {
      return errorBoundary(async () => {
        const body = new URLSearchParams()
        body.set('grant_type', 'refresh_token')
        body.set('refresh_token', refreshToken)
        body.set('client_id', clientId)
        body.set('client_secret', clientSecret)
        const request = createOAuth2Request(tokenEndpoint, body, origin)
        const tokens = await sendTokenRequest(request)
        return {
          accessToken: tokens.accessToken(),
          accessTokenExpiresAt: tokens.accessTokenExpiresAt().getTime(),
          refreshToken: tokens.refreshToken(),
        }
      })
    },

    revokeToken: (tokenType, token) => {
      return errorBoundary(async () => {
        const body = new URLSearchParams()
        body.set('token_type_hint', tokenType)
        body.set('token', token)
        body.set('client_id', clientId)
        body.set('client_secret', clientSecret)
        const request = createOAuth2Request(
          tokenRevocationEndpoint,
          body,
          origin,
        )
        await sendTokenRevocationRequest(request)
        return undefined
      })
    },
  }

  return roughOAuth2Provider
}

export { createRoughOAuth2Provider }
export type { RoughOAuth2Provider }
