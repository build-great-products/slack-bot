import { assertOk } from '@stayradiated/error-boundary'
import { defineFactory } from 'test-fixture-factory'

import type {
  KyselyDb,
  SlackUser,
  SlackUserId,
  SlackWorkspaceId,
} from '#src/database.ts'

import { genId } from '#src/utils/gen-id.ts'

import { deleteSlackUser } from '#src/db/slack-user/delete-slack-user.ts'
import { upsertSlackUser } from '#src/db/slack-user/upsert-slack-user.ts'

type CreateUserAttrs = {
  slackUserId?: SlackUserId
  slackWorkspaceId?: SlackWorkspaceId
  slackWorkspaceUrl?: string
  roughUserId?: string
  roughWorkspaceId?: string
  roughWorkspacePublicId?: string
  name?: string
  accessToken?: string
  accessTokenExpiresAt?: number
  refreshToken?: string
}

const slackUserFactory = defineFactory<
  {
    db: KyselyDb
  },
  // biome-ignore lint/suspicious/noConfusingVoidType: allow optional attrs
  void | CreateUserAttrs,
  SlackUser
>(async ({ db }, attrs) => {
  const slackUserId = attrs?.slackUserId ?? genId<SlackUserId>()
  const slackWorkspaceId = attrs?.slackWorkspaceId ?? genId<SlackWorkspaceId>()
  const roughUserId = attrs?.roughUserId ?? genId()
  const roughWorkspaceId = attrs?.roughWorkspaceId ?? genId()
  const roughWorkspacePublicId = attrs?.roughWorkspacePublicId ?? genId()

  const workspaceUser = await upsertSlackUser({
    db,
    insert: {
      slackUserId,
      slackWorkspaceId,
      slackWorkspaceUrl: 'https://test.slack.com/team/',
      roughUserId,
      roughWorkspaceId,
      roughWorkspacePublicId,
      name: attrs?.name ?? 'User Name',
      accessToken: attrs?.accessToken ?? 'xxx.access.token',
      accessTokenExpiresAt:
        attrs?.accessTokenExpiresAt ?? Date.now() + 1000 * 60 * 30,
      refreshToken: attrs?.refreshToken ?? 'xxx.refresh.token',
    },
  })
  assertOk(workspaceUser)

  return {
    value: workspaceUser,
    destroy: async () => {
      const deleteUserResult = await deleteSlackUser({
        db,
        where: {
          slackWorkspaceId: workspaceUser.slackWorkspaceId,
          slackUserId: workspaceUser.slackUserId,
        },
      })
      assertOk(deleteUserResult)
    },
  }
})

const useSlackUser = slackUserFactory.useValueFn
const useCreateSlackUser = slackUserFactory.useCreateFn

export { useCreateSlackUser, useSlackUser }
