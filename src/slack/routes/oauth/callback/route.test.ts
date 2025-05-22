import type { GetUserResponse, GetWorkspaceResponse } from '@roughapp/sdk'
import { assertOk } from '@stayradiated/error-boundary'
import { test as anyTest, expect } from 'vitest'

import type { SlackUserId, SlackWorkspaceId } from '#src/database.ts'

import { getRoughAppUrl } from '#src/env.ts'

import { useDb } from '#src/test/use-db.ts'
import { useInterceptor } from '#src/test/use-interceptor.ts'
import { useNow } from '#src/test/use-now.ts'
import { useRoughOAuth } from '#src/test/use-rough-oauth.ts'
import { useRouteServer } from '#src/test/use-route-server.ts'
import { useSlackUserOauth } from '#src/test/use-slack-user-oauth.ts'
import { useSlackUser } from '#src/test/use-slack-user.ts'

import { getSlackUser } from '#src/db/slack-user/get-slack-user.ts'

import { getRoute } from './route.ts'

const test = anyTest.extend({
  now: useNow(),
  db: useDb(),
  slackUser: useSlackUser(),
  slackWorkspaceOauth: useSlackUserOauth(),
  interceptor: useInterceptor(),
  roughOAuth: useRoughOAuth(),
  server: useRouteServer([getRoute]),
})

test('should require state & code query params', async ({ server }) => {
  const response = await server.fetch(
    new Request('http://internal/oauth/callback', {
      method: 'GET',
    }),
  )
  expect(response.status).toBe(400)

  const json = await response.json()
  expect(json).toStrictEqual({
    error: "The 'code' and 'state' query params are required.",
  })
})

test('should fail if state is invalid', async ({ server }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('state', '123')
  searchParams.set('code', 'abc')

  const response = await server.fetch(
    new Request(`http://internal/oauth/callback?${searchParams}`, {
      method: 'GET',
    }),
  )
  expect(response.status).toBe(404)

  const json = await response.json()
  expect(json).toStrictEqual({
    error: 'State not found.',
  })
})

test('should create SlackWorkspaceUser', async ({
  now,
  db,
  slackWorkspaceOauth,
  server,
  roughOAuth,
  interceptor,
}) => {
  const { slackWorkspaceId, slackUserId } = slackWorkspaceOauth
  const { accessToken, refreshToken, expiresInSeconds } =
    roughOAuth.interceptTokens()

  const roughApi = interceptor(getRoughAppUrl())
  roughApi
    .intercept({
      method: 'GET',
      path: '/api/v1/user/current',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })
    .reply(
      200,
      {
        id: 'user-3823',
        name: 'Larry Testerson',
        email: 'larry.testerson@hotmail.com',
        isDemoAccount: false,
      } satisfies GetUserResponse,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

  roughApi
    .intercept({
      method: 'GET',
      path: '/api/v1/workspace/current',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })
    .reply(
      200,
      {
        id: 'workspace.id.9783',
        publicId: 'HERSCHFELDT',
        name: 'Herschfeldt',
      } satisfies GetWorkspaceResponse,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

  const searchParams = new URLSearchParams()
  searchParams.set('state', slackWorkspaceOauth.state)
  searchParams.set('code', 'abc')

  const response = await server.fetch(
    new Request(`http://internal/oauth/callback?${searchParams}`, {
      method: 'GET',
    }),
  )
  expect(response.status).toBe(302)

  const slackUser = await getSlackUser({
    db,
    where: {
      slackWorkspaceId: slackWorkspaceId as SlackWorkspaceId,
      slackUserId: slackUserId as SlackUserId,
    },
  })
  assertOk(slackUser)

  expect(slackUser).toStrictEqual({
    slackUserId,
    slackWorkspaceId,

    slackWorkspaceUrl: 'https://test.slack.com/team/',
    roughUserId: 'user-3823',
    roughWorkspaceId: 'workspace.id.9783',
    roughWorkspacePublicId: 'HERSCHFELDT',
    name: 'Larry Testerson',

    accessToken,
    accessTokenExpiresAt: now + 1000 * expiresInSeconds,
    refreshToken,

    createdAt: now,
    updatedAt: now,
  })
})
