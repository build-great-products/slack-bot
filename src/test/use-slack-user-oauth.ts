import { assertOk } from '@stayradiated/error-boundary'
import { defineFactory } from 'test-fixture-factory'

import type {
  KyselyDb,
  SlackUser,
  SlackUserOauth,
  SlackUserOauthState,
} from '#src/database.ts'

import { deleteSlackUserOauth } from '#src/db/slack-user-oauth/delete-slack-user-oauth.ts'
import { upsertSlackUserOauth } from '#src/db/slack-user-oauth/upsert-slack-user-oauth.ts'

type CreateUserOauthAttrs = {
  state?: SlackUserOauthState
  code?: string
}

const slackUserOauthFactory = defineFactory<
  {
    db: KyselyDb
    slackUser: SlackUser
  },
  // biome-ignore lint/suspicious/noConfusingVoidType: allow optional attrs
  void | CreateUserOauthAttrs,
  SlackUserOauth
>(async ({ db, slackUser }, attrs) => {
  const slackUserOauth = await upsertSlackUserOauth({
    db,
    insert: {
      state: attrs?.state ?? ('1' as SlackUserOauthState),
      slackWorkspaceId: slackUser.slackWorkspaceId,
      slackWorkspaceUrl: slackUser.slackWorkspaceUrl,
      slackUserId: slackUser.slackUserId,
      codeVerifier: attrs?.code ?? '2',
      slackResponseUrl: null,
    },
  })
  assertOk(slackUserOauth)

  return {
    value: slackUserOauth,
    destroy: async () => {
      const deleteUserOauthResult = await deleteSlackUserOauth({
        db,
        where: {
          state: slackUserOauth.state,
        },
      })
      assertOk(deleteUserOauthResult)
    },
  }
})

const useCreateSlackUserOauth = slackUserOauthFactory.useCreateFn
const useSlackUserOauth = slackUserOauthFactory.useValueFn

export { useCreateSlackUserOauth, useSlackUserOauth }
