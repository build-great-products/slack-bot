import { assertOk } from '@stayradiated/error-boundary'
import { test as anyTest } from 'vitest'

import type { SlackUserId, SlackWorkspaceId } from '#src/database.js'

import { useDb } from '#src/test/use-db.js'
import { useSlackUser } from '#src/test/use-slack-user.ts'

import { getSlackUser } from './get-slack-user.js'

const test = anyTest.extend({
  db: useDb(),
  slackUser: useSlackUser(),
})

test('should return undefined if the user does not exist', async ({
  expect,
  db,
}) => {
  const result = await getSlackUser({
    db,
    where: {
      slackWorkspaceId: '-' as SlackWorkspaceId,
      slackUserId: '-' as SlackUserId,
    },
  })
  assertOk(result)
  expect(result).toBe(undefined)
})

test('should get the user if they exist', async ({ expect, db, slackUser }) => {
  const result = await getSlackUser({
    db,
    where: {
      slackWorkspaceId: slackUser.slackWorkspaceId,
      slackUserId: slackUser.slackUserId,
    },
  })
  assertOk(result)
  expect(result).toStrictEqual(slackUser)
})
