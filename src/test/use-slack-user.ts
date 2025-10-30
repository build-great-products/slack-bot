import { assertOk } from '@stayradiated/error-boundary'
import { createFactory } from 'test-fixture-factory'

import type {
  KyselyDb,
  SlackUser,
  SlackUserId,
  SlackWorkspaceId,
} from '#src/database.ts'
import { deleteSlackUser } from '#src/db/slack-user/delete-slack-user.ts'
import { upsertSlackUser } from '#src/db/slack-user/upsert-slack-user.ts'
import { genId } from '#src/utils/gen-id.ts'

const slackUserFactory = createFactory<SlackUser>('SlackUser')
  .withContext<{
    db: KyselyDb
  }>()
  .withSchema((f) => ({
    db: f.type<KyselyDb>().from('db'),
    slackUserId: f.type<SlackUserId>().default(() => genId<SlackUserId>()),
    slackWorkspaceId: f
      .type<SlackWorkspaceId>()
      .default(() => genId<SlackWorkspaceId>()),
    slackWorkspaceUrl: f
      .type<string>()
      .default(() => 'https://test.slack.com/team/'),
    roughUserId: f.type<string>().default(() => genId()),
    roughWorkspaceId: f.type<string>().default(() => genId()),
    roughWorkspacePublicId: f.type<string>().default(() => genId()),
    name: f.type<string>().default(() => 'User Name'),
    accessToken: f.type<string>().default(() => 'xxx.access.token'),
    accessTokenExpiresAt: f
      .type<number>()
      .default(() => Date.now() + 1000 * 60 * 30),
    refreshToken: f.type<string>().default(() => 'xxx.refresh.token'),
  }))
  .fixture(async (attrs, use) => {
    const {
      db,
      slackUserId,
      slackWorkspaceId,
      slackWorkspaceUrl,
      roughUserId,
      roughWorkspaceId,
      roughWorkspacePublicId,
      name,
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
    } = attrs

    const workspaceUser = await upsertSlackUser({
      db,
      insert: {
        slackUserId,
        slackWorkspaceId,
        slackWorkspaceUrl,
        roughUserId,
        roughWorkspaceId,
        roughWorkspacePublicId,
        name,
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
      },
    })
    assertOk(workspaceUser)

    await use(workspaceUser)

    const deleteUserResult = await deleteSlackUser({
      db,
      where: {
        slackWorkspaceId: workspaceUser.slackWorkspaceId,
        slackUserId: workspaceUser.slackUserId,
      },
    })
    assertOk(deleteUserResult)
  })

const useSlackUser = slackUserFactory.useValue

export { useSlackUser }
