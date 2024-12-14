import { createRoughOAuth2Provider } from '@roughapp/sdk'
import { getOriginUrl, getRoughAppUrl, getRoughConfig } from '#src/env.ts'

const getRoughOAuth = () => {
  const { clientId, clientSecret } = getRoughConfig()
  const redirectUri = new URL('/oauth/callback', getOriginUrl()).toString()
  return createRoughOAuth2Provider({
    baseUrl: getRoughAppUrl(),
    clientId,
    clientSecret,
    redirectUri,
  })
}

export { getRoughOAuth }
