import { errorBoundary } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  SlackUser,
  SlackUserId,
  SlackWorkspaceId,
} from '#src/database.ts'

type GetSlackUserOptions = {
  db: KyselyDb
  where: {
    slackWorkspaceId: SlackWorkspaceId
    slackUserId: SlackUserId
  }
}

const getSlackUser = async (
  options: GetSlackUserOptions,
): Promise<SlackUser | undefined | Error> => {
  const { db, where } = options

  return errorBoundary(() =>
    db
      .selectFrom('slackUser')
      .selectAll('slackUser')
      .where('slackUser.slackWorkspaceId', '=', where.slackWorkspaceId)
      .where('slackUser.slackUserId', '=', where.slackUserId)
      .executeTakeFirst(),
  )
}

export { getSlackUser }
