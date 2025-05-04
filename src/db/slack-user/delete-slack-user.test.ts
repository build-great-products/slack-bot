import { assertOk } from '@stayradiated/error-boundary'
import { test as anyTest } from 'vitest'

import type { SlackUserId, SlackWorkspaceId } from '#src/database.js'

import { useDb } from '#src/test/use-db.js'
import { useSlackUser } from '#src/test/use-slack-user.ts'

import { deleteSlackUser } from './delete-slack-user.js'

const test = anyTest.extend({
  db: useDb(),
  slackUser: useSlackUser(),
})

test('should succeed, even if the user does not exist', async ({
  expect,
  db,
}) => {
  const result = await deleteSlackUser({
    db,
    where: {
      slackWorkspaceId: '-' as SlackWorkspaceId,
      slackUserId: '-' as SlackUserId,
    },
  })
  assertOk(result)
  expect(result).toBe(0)
})

test('should delete the user if they exist', async ({
  expect,
  db,
  slackUser,
}) => {
  const result = await deleteSlackUser({
    db,
    where: {
      slackWorkspaceId: slackUser.slackWorkspaceId,
      slackUserId: slackUser.slackUserId,
    },
  })
  assertOk(result)
  expect(result).toBe(1)
})
