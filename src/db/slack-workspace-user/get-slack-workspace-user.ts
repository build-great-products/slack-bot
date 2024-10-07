import { errorBoundary } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  SlackWorkspaceId,
  SlackWorkspaceUser,
  UserId,
} from '../../database.js'

type GetSlackWorkspaceUserApiTokenOptions = {
  db: KyselyDb
  where: {
    slackWorkspaceId: SlackWorkspaceId
    userId: UserId
  }
}

const getSlackWorkspaceUser = async (
  options: GetSlackWorkspaceUserApiTokenOptions,
): Promise<SlackWorkspaceUser | Error> => {
  const { db, where } = options

  return errorBoundary(() =>
    db
      .selectFrom('slackWorkspaceUser')
      .selectAll('slackWorkspaceUser')
      .where('slackWorkspaceUser.slackWorkspaceId', '=', where.slackWorkspaceId)
      .where('slackWorkspaceUser.userId', '=', where.userId)
      .executeTakeFirstOrThrow(),
  )
}

export { getSlackWorkspaceUser }
