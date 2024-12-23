import { assertOk } from '@stayradiated/error-boundary'
import { test as anyTest, expect } from 'vitest'

import { getRoughAppUrl } from '#src/env.ts'

import { useDb } from '#src/test/use-db.ts'
import { useInterceptor } from '#src/test/use-interceptor.ts'
import { useRoughOAuth } from '#src/test/use-rough-oauth.ts'
import { useSlackUser } from '#src/test/use-slack-user.ts'

import { updateSlackUser } from '#src/db/slack-user/update-slack-user.ts'

import { createInsight } from './create-insight.ts'

const test = anyTest.extend({
  db: useDb(),
  slackUser: useSlackUser(),
  interceptor: useInterceptor(),
  roughOAuth: useRoughOAuth(),
})

test('create an insight', async ({
  db,
  roughOAuth,
  slackUser,
  interceptor,
}) => {
  const { slackWorkspaceId, slackUserId } = slackUser

  interceptor(getRoughAppUrl())
    .intercept({
      method: 'POST',
      path: '/api/v1/note',
      headers: {
        Authorization: `Bearer ${slackUser.accessToken}`,
      },
    })
    .reply(200, {
      // created note details are not used
    })
    .times(1)

  const result = await createInsight({
    db,
    roughOAuth,
    slackUserId,
    slackWorkspaceId,
    content: 'hello world',
  })

  expect(result).toStrictEqual({
    success: true,
    reply: {
      text: `✅ hello world [📌](${getRoughAppUrl()}/workspace/${slackUser.roughWorkspacePublicId}/insight/active "View in Rough")`,
      response_type: 'ephemeral',
    },
  })
})

test('automatically refresh token if needed', async ({
  db,
  roughOAuth,
  slackUser,
  interceptor,
}) => {
  const { slackWorkspaceId, slackUserId } = slackUser

  // mark accessToken as expired
  assertOk(
    await updateSlackUser({
      db,
      where: { slackUserId, slackWorkspaceId },
      set: { accessTokenExpiresAt: 0 },
    }),
  )

  // mock API for refreshing tokens
  const { accessToken } = roughOAuth.interceptTokens()

  interceptor(getRoughAppUrl())
    .intercept({
      method: 'POST',
      path: '/api/v1/note',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .reply(200, {
      // created note details are not used
    })
    .times(1)

  const result = await createInsight({
    db,
    roughOAuth,
    slackUserId,
    slackWorkspaceId,
    content: 'whats up doc?',
  })

  expect(result).toStrictEqual({
    success: true,
    reply: {
      text: `✅ whats up doc? [📌](${getRoughAppUrl()}/workspace/${slackUser.roughWorkspacePublicId}/insight/active "View in Rough")`,
      response_type: 'ephemeral',
    },
  })
})

test('create an insight with a reference', async ({
  db,
  roughOAuth,
  slackUser,
  interceptor,
}) => {
  const { slackWorkspaceId, slackUserId } = slackUser

  interceptor(getRoughAppUrl())
    .intercept({
      method: 'POST',
      path: '/api/v1/note',
      headers: {
        Authorization: `Bearer ${slackUser.accessToken}`,
      },
    })
    .reply(200, {
      // created note details are not used
    })
    .times(1)

  interceptor(getRoughAppUrl())
    .intercept({
      method: 'POST',
      path: '/api/v1/reference',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${slackUser.accessToken}`,
      },
      body: JSON.stringify({
        name: 'Slack: "hello world this is a particularly insig…"',
        url: 'https://test.slack.com/archives/channel/p123',
      }),
    })
    .reply(200, {})
    .times(1)

  const result = await createInsight({
    db,
    roughOAuth,
    slackUserId,
    slackWorkspaceId,
    content: 'hello world this is a particularly insightful insight',
    referencePath: '/archives/channel/p123',
  })

  expect(result).toStrictEqual({
    success: true,
    reply: {
      text: `✅ hello world this is a particularly insightful insight [📌](${getRoughAppUrl()}/workspace/${slackUser.roughWorkspacePublicId}/insight/active "View in Rough")`,
      response_type: 'ephemeral',
    },
  })
})

test('create an insight with a person', async ({
  db,
  roughOAuth,
  slackUser,
  interceptor,
}) => {
  const { slackWorkspaceId, slackUserId } = slackUser

  interceptor(getRoughAppUrl())
    .intercept({
      method: 'POST',
      path: '/api/v1/note',
      headers: {
        Authorization: `Bearer ${slackUser.accessToken}`,
      },
    })
    .reply(200, {
      // created note details are not used
    })
    .times(1)

  interceptor(getRoughAppUrl())
    .intercept({
      method: 'POST',
      path: '/api/v1/person',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${slackUser.accessToken}`,
      },
      body: JSON.stringify({
        name: 'Johny Appleseed',
      }),
    })
    .reply(200, {})
    .times(1)

  const result = await createInsight({
    db,
    roughOAuth,
    slackUserId,
    slackWorkspaceId,
    content: 'hello world this is a particularly insightful insight',
    personName: 'Johny Appleseed',
  })

  expect(result).toStrictEqual({
    success: true,
    reply: {
      text: `✅ hello world this is a particularly insightful insight [📌](${getRoughAppUrl()}/workspace/${slackUser.roughWorkspacePublicId}/insight/active "View in Rough")`,
      response_type: 'ephemeral',
    },
  })
})
