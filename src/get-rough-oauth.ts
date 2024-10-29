import { getOriginUrl, getRoughConfig } from '#src/env.ts'
import { createRoughOAuth2Provider } from '#src/rough/oauth2.ts'

const getRoughOAuth = () => {
  const { clientId, clientSecret } = getRoughConfig()
  const redirectUri = new URL('/oauth/callback', getOriginUrl()).toString()
  return createRoughOAuth2Provider({ clientId, clientSecret, redirectUri })
}

export { getRoughOAuth }
