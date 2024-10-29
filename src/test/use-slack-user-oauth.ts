import { assertOk } from '@stayradiated/error-boundary'

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
type CreateUserOauthFn = (
  attrs?: CreateUserOauthAttrs,
) => Promise<SlackUserOauth>

type UseCreateUserOauthOptions = {
  db: KyselyDb
  slackUser: SlackUser
}

const useCreateSlackUserOauth =
  () =>
  async (
    { db, slackUser }: UseCreateUserOauthOptions,
    use: (fn: CreateUserOauthFn) => Promise<void>,
  ): Promise<void> => {
    const slackUserOauthStateSet = new Set<SlackUserOauthState>()

    const createUserOauth: CreateUserOauthFn = async (attrs) => {
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
      slackUserOauthStateSet.add(slackUserOauth.state)

      return slackUserOauth
    }

    await use(createUserOauth)

    for (const slackUserOauthState of slackUserOauthStateSet) {
      const deleteUserOauthResult = await deleteSlackUserOauth({
        db,
        where: {
          state: slackUserOauthState,
        },
      })
      assertOk(deleteUserOauthResult)
    }
  }

const useSlackUserOauth = (attrs?: CreateUserOauthAttrs) => {
  return async (
    { db, slackUser }: UseCreateUserOauthOptions,
    use: (useroauth: SlackUserOauth) => Promise<void>,
  ): Promise<void> => {
    await useCreateSlackUserOauth()(
      { db, slackUser },
      async (createUserOauth) => {
        const useroauth = await createUserOauth(attrs)
        await use(useroauth)
      },
    )
  }
}

export { useCreateSlackUserOauth, useSlackUserOauth }
