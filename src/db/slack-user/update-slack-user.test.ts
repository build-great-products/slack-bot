import { assertError, assertOk } from '@stayradiated/error-boundary'
import { test as anyTest } from 'vitest'

import type { SlackUserId, SlackWorkspaceId } from '#src/database.js'

import { useDb } from '#src/test/use-db.js'
import { useSlackUser } from '#src/test/use-slack-user.ts'

import { updateSlackUser } from './update-slack-user.js'

const test = anyTest.extend({
  db: useDb(),
  slackUser: useSlackUser(),
})

test('should throw error if the user does not exist', async ({
  expect,
  db,
}) => {
  const result = await updateSlackUser({
    db,
    where: {
      slackWorkspaceId: '-' as SlackWorkspaceId,
      slackUserId: '-' as SlackUserId,
    },
    set: {},
  })
  assertError(result)
  expect(result).toMatchInlineSnapshot('[Error: no result]')
})

test('should always bump `updatedAt` timestamp', async ({
  expect,
  db,
  slackUser,
}) => {
  const result = await updateSlackUser({
    db,
    where: {
      slackWorkspaceId: slackUser.slackWorkspaceId,
      slackUserId: slackUser.slackUserId,
    },
    set: {
      // intentionally not updating any properties
    },
  })
  assertOk(result)
  expect(result).toStrictEqual({
    ...slackUser,
    updatedAt: expect.any(Number),
  })
  expect(result.updatedAt).toBeGreaterThan(slackUser.updatedAt)
})

test('should update slackUser fields', async ({ expect, db, slackUser }) => {
  const set = {
    accessToken: 'UPDATED_ACCESS_TOKEN',
    accessTokenExpiresAt: Date.now(),
    refreshToken: 'UPDATED_REFRESH_TOKEN',
    name: 'UPDATED_NAME',
  }
  const result = await updateSlackUser({
    db,
    where: {
      slackWorkspaceId: slackUser.slackWorkspaceId,
      slackUserId: slackUser.slackUserId,
    },
    set,
  })
  assertOk(result)
  expect(result).toStrictEqual({
    ...slackUser,
    accessToken: set.accessToken,
    accessTokenExpiresAt: set.accessTokenExpiresAt,
    refreshToken: set.refreshToken,
    name: set.name,
    updatedAt: expect.any(Number),
  })
})
