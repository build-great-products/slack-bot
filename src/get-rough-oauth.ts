import { getRoughConfig } from '#src/env.ts'
import { createRoughOAuth2Provider } from '#src/rough/oauth2.ts'

const getRoughOAuth = () => {
  const { clientId, clientSecret, redirectUri } = getRoughConfig()
  return createRoughOAuth2Provider({ clientId, clientSecret, redirectUri })
}

export { getRoughOAuth }
