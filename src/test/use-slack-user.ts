import { assertOk } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  SlackUser,
  SlackUserId,
  SlackWorkspaceId,
} from '#src/database.ts'

import { PirateSet } from '#src/utils/pirate-set'

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
type CreateUserFn = (attrs?: CreateUserAttrs) => Promise<SlackUser>

type UseCreateUserOptions = {
  db: KyselyDb
}

const useCreateSlackUser =
  () =>
  async (
    { db }: UseCreateUserOptions,
    use: (fn: CreateUserFn) => Promise<void>,
  ): Promise<void> => {
    const workspaceuserIdSet = new PirateSet<[SlackWorkspaceId, SlackUserId]>(
      (a, b) => {
        return a[0] === b[0] && a[1] === b[1]
      },
    )

    const createUser: CreateUserFn = async (attrs) => {
      const workspaceUser = await upsertSlackUser({
        db,
        insert: {
          slackUserId: attrs?.slackUserId ?? ('1' as SlackUserId),
          slackWorkspaceId:
            attrs?.slackWorkspaceId ?? ('0' as SlackWorkspaceId),
          slackWorkspaceUrl: 'https://test.slack.com/team/',
          roughUserId: attrs?.roughUserId ?? '2',
          roughWorkspaceId: attrs?.roughWorkspaceId ?? '3',
          roughWorkspacePublicId: attrs?.roughWorkspacePublicId ?? '3',
          name: attrs?.name ?? '3',
          accessToken: attrs?.accessToken ?? 'xxx.access.token',
          accessTokenExpiresAt:
            attrs?.accessTokenExpiresAt ?? Date.now() + 1000 * 60 * 30,
          refreshToken: attrs?.refreshToken ?? 'xxx.refresh.token',
        },
      })
      assertOk(workspaceUser)
      workspaceuserIdSet.add([
        workspaceUser.slackWorkspaceId,
        workspaceUser.slackUserId,
      ])

      return workspaceUser
    }

    await use(createUser)

    for (const [slackWorkspaceId, slackUserId] of workspaceuserIdSet) {
      const deleteUserResult = await deleteSlackUser({
        db,
        where: {
          slackWorkspaceId,
          slackUserId,
        },
      })
      assertOk(deleteUserResult)
    }
  }

const useSlackUser = (attrs?: CreateUserAttrs) => {
  return async (
    { db }: UseCreateUserOptions,
    use: (workspaceuser: SlackUser) => Promise<void>,
  ): Promise<void> => {
    await useCreateSlackUser()({ db }, async (createUser) => {
      const workspaceuser = await createUser(attrs)
      await use(workspaceuser)
    })
  }
}

export { useCreateSlackUser, useSlackUser }
