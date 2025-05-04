import type { RoughOAuth2Provider } from '@roughapp/sdk'
import { defineFactory } from 'test-fixture-factory'
import { vi } from 'vitest'

const roughOAuthFactory = defineFactory<
  Record<string, unknown>, // no deps
  void, // no attributes
  RoughOAuth2Provider // returns a roughOAuth instance
>(() => {
  const roughOAuth = {
    createAuthorizationURL: vi.fn(),
    validateAuthorizationCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
  } satisfies RoughOAuth2Provider

  return {
    value: roughOAuth,
  }
})

const mockRoughOAuth = roughOAuthFactory.useValueFn

export { mockRoughOAuth }
