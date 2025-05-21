import { assertOk } from '@stayradiated/error-boundary'
import { test as anyTest, expect } from 'vitest'

import type { SlackUserId, SlackWorkspaceId } from '#src/database.ts'

import { useDb } from '#src/test/use-db.ts'
import { useNonce } from '#src/test/use-nonce.ts'
import { useNow } from '#src/test/use-now.ts'

import { getSlackUser } from '#src/db/slack-user/get-slack-user.ts'

import { deleteSlackUser } from './delete-slack-user.ts'
import { upsertSlackUser } from './upsert-slack-user.ts'

const test = anyTest.extend({
  nonce: useNonce(),
  now: useNow(),
  db: useDb(),
})

test('should insert a new slack user', async ({ nonce, now, db }) => {
  const slackUserId = `slack.user.id.${nonce}` as SlackUserId
  const slackWorkspaceId = `slack.workspace.id.${nonce}` as SlackWorkspaceId

  const upsertedSlackUser = await upsertSlackUser({
    db,
    insert: {
      slackUserId,
      slackWorkspaceId,
      slackWorkspaceUrl: '...',
      roughUserId: 'rough.user.id',
      roughWorkspaceId: 'rough.workspace.id',
      roughWorkspacePublicId: 'rough.workspace.public.id',
      name: 'name',
      accessToken: 'xxx.access.token',
      accessTokenExpiresAt: now + 1000 * 60,
      refreshToken: 'xxx.refresh.token',
    },
  })
  assertOk(upsertedSlackUser)

  const slackUser = await getSlackUser({
    db,
    where: {
      slackUserId,
      slackWorkspaceId,
    },
  })
  assertOk(slackUser)

  expect(slackUser).toStrictEqual({
    slackUserId,
    slackWorkspaceId,
    slackWorkspaceUrl: '...',
    roughUserId: 'rough.user.id',
    roughWorkspaceId: 'rough.workspace.id',
    roughWorkspacePublicId: 'rough.workspace.public.id',
    name: 'name',
    accessToken: 'xxx.access.token',
    accessTokenExpiresAt: now + 1000 * 60,
    refreshToken: 'xxx.refresh.token',
    createdAt: now,
    updatedAt: now,
  })
  expect(upsertedSlackUser).toStrictEqual(slackUser)

  // cleanup
  assertOk(
    await deleteSlackUser({ db, where: { slackUserId, slackWorkspaceId } }),
  )
})

test('should update an existing slack user', async ({ nonce, now, db }) => {
  const slackUserId = `slack.user.id.${nonce}` as SlackUserId
  const slackWorkspaceId = `slack.workspace.id.${nonce}` as SlackWorkspaceId

  assertOk(
    await upsertSlackUser({
      db,
      insert: {
        slackUserId,
        slackWorkspaceId,
        slackWorkspaceUrl: '...',
        roughUserId: 'rough.user.id',
        roughWorkspaceId: 'rough.workspace.id',
        roughWorkspacePublicId: 'rough.workspace.public.id',
        name: 'name',
        accessToken: 'xxx.access.token',
        accessTokenExpiresAt: now + 1000 * 60,
        refreshToken: 'xxx.refresh.token',
      },
    }),
  )

  const upsertedSlackUser = await upsertSlackUser({
    db,
    insert: {
      slackUserId,
      slackWorkspaceId,

      slackWorkspaceUrl: '.../v2',
      roughUserId: 'rough.user.id/v2',
      roughWorkspaceId: 'rough.workspace.id/v2',
      roughWorkspacePublicId: 'rough.workspace.public.id/v2',
      name: 'name/v1',
      accessToken: 'xxx.access.token/v2',
      accessTokenExpiresAt: now + 1000 * 70,
      refreshToken: 'xxx.refresh.token/v2',
    },
  })
  assertOk(upsertedSlackUser)

  const slackUser = await getSlackUser({
    db,
    where: {
      slackUserId,
      slackWorkspaceId,
    },
  })
  assertOk(slackUser)

  expect(slackUser).toStrictEqual({
    slackUserId,
    slackWorkspaceId,
    slackWorkspaceUrl: '.../v2',
    roughUserId: 'rough.user.id/v2',
    roughWorkspaceId: 'rough.workspace.id/v2',
    roughWorkspacePublicId: 'rough.workspace.public.id/v2',
    name: 'name/v1',
    accessToken: 'xxx.access.token/v2',
    accessTokenExpiresAt: now + 1000 * 70,
    refreshToken: 'xxx.refresh.token/v2',
    createdAt: now,
    updatedAt: now,
  })
  expect(upsertedSlackUser).toStrictEqual(slackUser)

  assertOk(
    await deleteSlackUser({ db, where: { slackUserId, slackWorkspaceId } }),
  )
})
