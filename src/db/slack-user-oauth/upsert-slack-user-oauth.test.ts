import { assertOk } from '@stayradiated/error-boundary'
import { test as anyTest, expect } from 'vitest'

import type { SlackUserOauthState } from '#src/database.ts'

import { useDb } from '#src/test/use-db.ts'
import { useNow } from '#src/test/use-now.ts'
import { useSlackUser } from '#src/test/use-slack-user.ts'

import { getSlackUserOauth } from '#src/db/slack-user-oauth/get-slack-user-oauth.ts'

import { upsertSlackUserOauth } from './upsert-slack-user-oauth.ts'

const test = anyTest.extend({
  now: useNow(),
  db: useDb(),
  slackUser: useSlackUser(),
})

test('should insert a new slack oauth user', async ({ now, db, slackUser }) => {
  const state = 'state' as SlackUserOauthState

  const result = await upsertSlackUserOauth({
    db,
    insert: {
      state,
      slackUserId: slackUser.slackUserId,
      slackWorkspaceId: slackUser.slackWorkspaceId,
      slackWorkspaceUrl: 'slackWorkspaceUrl',
      codeVerifier: 'codeVerifier',
      slackResponseUrl: null,
    },
  })
  assertOk(result)

  const slackUserOauth = await getSlackUserOauth({
    db,
    where: {
      state,
    },
  })
  assertOk(slackUserOauth)

  expect(slackUserOauth).toStrictEqual({
    slackUserId: slackUser.slackUserId,
    slackWorkspaceId: slackUser.slackWorkspaceId,
    slackWorkspaceUrl: 'slackWorkspaceUrl',
    codeVerifier: 'codeVerifier',
    state,
    slackResponseUrl: null,
    createdAt: now,
    updatedAt: now,
  })
  expect(result).toStrictEqual(slackUserOauth)
})
