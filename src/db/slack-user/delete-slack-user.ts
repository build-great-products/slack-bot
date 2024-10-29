import { errorBoundary } from '@stayradiated/error-boundary'
import type { DeleteResult } from 'kysely'

import type { KyselyDb, SlackUserId, SlackWorkspaceId } from '#src/database.ts'

type DeleteSlackUserApiTokenOptions = {
  db: KyselyDb
  where: {
    slackWorkspaceId: SlackWorkspaceId
    slackUserId: SlackUserId
  }
}

const deleteSlackUser = async (
  options: DeleteSlackUserApiTokenOptions,
): Promise<DeleteResult | Error> => {
  const { db, where } = options

  return errorBoundary(() =>
    db
      .deleteFrom('slackUser')
      .where('slackUser.slackWorkspaceId', '=', where.slackWorkspaceId)
      .where('slackUser.slackUserId', '=', where.slackUserId)
      .executeTakeFirst(),
  )
}

export { deleteSlackUser }
