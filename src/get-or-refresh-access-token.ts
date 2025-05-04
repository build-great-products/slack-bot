import type { RoughOAuth2Provider } from '@roughapp/sdk'
import { OAuth2RequestError } from 'arctic'
import type { KyselyDb, SlackUser } from '#src/database.ts'

import { deleteSlackUser } from '#src/db/slack-user/delete-slack-user.ts'
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

  const deadline = Date.now() + expirationBufferMs
  const accessTokenIsValid = slackUser.accessTokenExpiresAt > deadline
  if (accessTokenIsValid) {
    return slackUser.accessToken
  }

  // need to refresh the token
  const tokens = await roughOAuth.refreshAccessToken(slackUser.refreshToken)
  if (tokens instanceof Error) {
    if (tokens instanceof OAuth2RequestError) {
      // refresh token may have expired, let's delete the user
      const deleteUserResult = await deleteSlackUser({
        db,
        where: {
          slackUserId: slackUser.slackUserId,
          slackWorkspaceId: slackUser.slackWorkspaceId,
        },
      })
      if (deleteUserResult instanceof Error) {
        return deleteUserResult
      }
      if (deleteUserResult === 0) {
        console.warn(
          `Tried to deleteSlackUser, but unexpectedly did not find them in the database: slackUserId: '${slackUser.slackUserId}', slackWorkspaceId: '${slackUser.slackWorkspaceId}'`,
        )
      }
      return tokens
    }
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
