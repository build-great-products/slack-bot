import { assertError, assertOk } from '@stayradiated/error-boundary'
import { OAuth2RequestError } from 'arctic'
import { test as anyTest, beforeEach, describe, vi } from 'vitest'

import { getOrRefreshAccessToken } from './get-or-refresh-access-token.js'

import { mockDb } from '#src/test/mock-db.ts'
import { mockRoughOAuth } from './test/mock-rough-oauth.js'
import { mockSlackUser } from './test/mock-slack-user.js'

import { deleteSlackUser } from '#src/db/slack-user/delete-slack-user.ts'
import { updateSlackUser } from '#src/db/slack-user/update-slack-user.ts'

vi.mock('#src/db/slack-user/update-slack-user.ts')
vi.mock('#src/db/slack-user/delete-slack-user.ts')

const test = anyTest.extend({
  db: mockDb(),
  roughOAuth: mockRoughOAuth(),
  slackUser: mockSlackUser(),
})

describe('getOrRefreshAccessToken', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('if the access token is not expired, should return the access token', async ({
    expect,
    db,
    roughOAuth,
    slackUser,
  }) => {
    // expires in 5 minutes
    slackUser.accessTokenExpiresAt = Date.now() + 60 * 5 * 1000
    const result = await getOrRefreshAccessToken({ db, roughOAuth, slackUser })

    // should NOT have called the refresh token
    expect(roughOAuth.refreshAccessToken).not.toHaveBeenCalled()

    // should NOT have touched the db
    expect(updateSlackUser).not.toHaveBeenCalledOnce()
    expect(deleteSlackUser).not.toHaveBeenCalled()

    assertOk(result)
    expect(result).toStrictEqual(slackUser.accessToken)
  })

  test('if the access is expired, should successfully refresh the access token', async ({
    expect,
    db,
    roughOAuth,
    slackUser,
  }) => {
    const nextTokens = {
      accessToken: 'refreshed.access.token',
      accessTokenExpiresAt: Date.now() + 60 * 5 * 1000,
      refreshToken: 'refreshed.refresh.token',
    }
    vi.mocked(roughOAuth.refreshAccessToken).mockResolvedValue(nextTokens)

    // expired token
    slackUser.accessTokenExpiresAt = Date.now()
    const result = await getOrRefreshAccessToken({ db, roughOAuth, slackUser })

    // should have called the refresh token
    expect(roughOAuth.refreshAccessToken).toHaveBeenCalledOnce()

    // should have updated the db
    expect(updateSlackUser).toHaveBeenCalledOnce()
    expect(updateSlackUser).toHaveBeenCalledWith({
      db,
      where: {
        slackUserId: slackUser.slackUserId,
        slackWorkspaceId: slackUser.slackWorkspaceId,
      },
      set: {
        accessToken: nextTokens.accessToken,
        accessTokenExpiresAt: nextTokens.accessTokenExpiresAt,
        refreshToken: nextTokens.refreshToken,
      },
    })

    // should NOT have deleted the slack user
    expect(deleteSlackUser).not.toHaveBeenCalled()

    assertOk(result)
    expect(result).toStrictEqual(nextTokens.accessToken)
  })

  test('if an error occurs while refreshing the access token, should return the error', async ({
    expect,
    db,
    roughOAuth,
    slackUser,
  }) => {
    const error = new Error('something went wrong')
    vi.mocked(roughOAuth.refreshAccessToken).mockResolvedValue(error)

    // expired token
    slackUser.accessTokenExpiresAt = Date.now()
    const result = await getOrRefreshAccessToken({ db, roughOAuth, slackUser })

    // should have called the refresh token
    expect(roughOAuth.refreshAccessToken).toHaveBeenCalledOnce()

    // should NOT have updated the db
    expect(updateSlackUser).not.toHaveBeenCalled()

    // should NOT have deleted the slack user
    expect(deleteSlackUser).not.toHaveBeenCalledOnce()

    assertError(result)
    expect(result).toStrictEqual(error)
  })

  test('if the refresh token is expired, should delete the slack user', async ({
    expect,
    db,
    roughOAuth,
    slackUser,
  }) => {
    const error = new OAuth2RequestError(
      'invalid_grant',
      'Refresh token expired',
      null,
      null,
    )
    vi.mocked(roughOAuth.refreshAccessToken).mockResolvedValue(error)

    // expired token
    slackUser.accessTokenExpiresAt = Date.now()
    const result = await getOrRefreshAccessToken({ db, roughOAuth, slackUser })

    // should have called the refresh token
    expect(roughOAuth.refreshAccessToken).toHaveBeenCalledOnce()

    // should NOT have updated the db
    expect(updateSlackUser).not.toHaveBeenCalled()

    // should have deleted the slack user
    expect(deleteSlackUser).toHaveBeenCalledOnce()
    expect(deleteSlackUser).toHaveBeenCalledWith({
      db,
      where: {
        slackUserId: slackUser.slackUserId,
        slackWorkspaceId: slackUser.slackWorkspaceId,
      },
    })

    assertError(result)
    expect(result).toStrictEqual(error)
  })
})
