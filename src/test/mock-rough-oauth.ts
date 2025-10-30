import type { RoughOAuth2Provider } from '@roughapp/sdk'
import { createFactory } from 'test-fixture-factory'
import { vi } from 'vitest'

const mockRoughOAuthFactory = createFactory<RoughOAuth2Provider>(
  'MockRoughOAuth',
).fixture(async (_attrs, use) => {
  const roughOAuth = {
    createAuthorizationURL: vi.fn(),
    validateAuthorizationCode: vi.fn(),
    refreshAccessToken: vi.fn(),
    revokeToken: vi.fn(),
  } satisfies RoughOAuth2Provider

  await use(roughOAuth)
})

const mockRoughOAuth = mockRoughOAuthFactory.useValue

export { mockRoughOAuth }
