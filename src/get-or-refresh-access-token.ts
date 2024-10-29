import type { KyselyDb, SlackUser } from '#src/database.ts'
import type { RoughOAuth2Provider } from '#src/rough/oauth2.ts'

import { updateSlackUser } from '#src/db/slack-user/update-slack-user.ts'

// 1 minute of buffer
const DEFAULT_EXPIRATION_BUFFER_MS = 1000 * 60 * 1

type GetOrRefreshAccessToken = {
  db: KyselyDb
  roughOAuth: RoughOAuth2Provider
  slackUser: SlackUser
  expirationBufferMs?: number
}

const getOrRefreshAccessToken = async (
  options: GetOrRefreshAccessToken,
): Promise<string | Error> => {
  const {
    db,
    roughOAuth,
    slackUser,
    expirationBufferMs = DEFAULT_EXPIRATION_BUFFER_MS,
  } = options

  const deadline = Date.now() - expirationBufferMs
  const accessTokenIsValid = slackUser.accessTokenExpiresAt > deadline
  if (accessTokenIsValid) {
    return slackUser.accessToken
  }

  // need to refresh the token
  const tokens = await roughOAuth.refreshAccessToken(slackUser.refreshToken)
  if (tokens instanceof Error) {
    return tokens
  }

  const updatedSlackUser = await updateSlackUser({
    db,
    where: {
      slackUserId: slackUser.slackUserId,
      slackWorkspaceId: slackUser.slackWorkspaceId,
    },
    set: {
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
      refreshToken: tokens.refreshToken,
    },
  })
  if (updatedSlackUser instanceof Error) {
    return updatedSlackUser
  }

  return tokens.accessToken
}

export { getOrRefreshAccessToken }
