import { assertOk } from '@stayradiated/error-boundary'
import { createFactory } from 'test-fixture-factory'

import type {
  KyselyDb,
  SlackUser,
  SlackUserId,
  SlackUserOauth,
  SlackUserOauthState,
  SlackWorkspaceId,
} from '#src/database.ts'
import { deleteSlackUserOauth } from '#src/db/slack-user-oauth/delete-slack-user-oauth.ts'
import { upsertSlackUserOauth } from '#src/db/slack-user-oauth/upsert-slack-user-oauth.ts'
import { genId } from '#src/utils/gen-id.ts'

const slackUserOauthFactory = createFactory<SlackUserOauth>('SlackUserOauth')
  .withContext<{
    db: KyselyDb
    slackUser: SlackUser
  }>()
  .withSchema((f) => ({
    db: f.type<KyselyDb>().from('db'),
    slackUserId: f
      .type<SlackUserId>()
      .from('slackUser', (ctx) => ctx.slackUser.slackUserId),
    slackWorkspaceId: f
      .type<SlackWorkspaceId>()
      .from('slackUser', (ctx) => ctx.slackUser.slackWorkspaceId),
    slackWorkspaceUrl: f
      .type<string>()
      .from('slackUser', (ctx) => ctx.slackUser.slackWorkspaceUrl),
    state: f
      .type<SlackUserOauthState>()
      .default(() => genId<SlackUserOauthState>()),
    codeVerifier: f.type<string>().default(() => genId()),
  }))
  .fixture(async (attrs, use) => {
    const {
      db,
      slackUserId,
      slackWorkspaceId,
      slackWorkspaceUrl,
      state,
      codeVerifier,
    } = attrs

    const slackUserOauth = await upsertSlackUserOauth({
      db,
      insert: {
        state,
        slackWorkspaceId,
        slackWorkspaceUrl,
        slackUserId,
        codeVerifier,
        slackResponseUrl: null,
      },
    })
    assertOk(slackUserOauth)

    await use(slackUserOauth)

    const deleteUserOauthResult = await deleteSlackUserOauth({
      db,
      where: {
        state: slackUserOauth.state,
      },
    })
    assertOk(deleteUserOauthResult)
  })

const useSlackUserOauth = slackUserOauthFactory.useValue

export { useSlackUserOauth }
