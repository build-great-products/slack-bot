import { errorBoundary } from '@stayradiated/error-boundary'

import type { KyselyDb, SlackUserId, SlackWorkspaceId } from '#src/database.ts'

type DeleteSlackUserOptions = {
  db: KyselyDb
  where: {
    slackWorkspaceId: SlackWorkspaceId
    slackUserId: SlackUserId
  }
}

const deleteSlackUser = async (
  options: DeleteSlackUserOptions,
): Promise<number | Error> => {
  const { db, where } = options

  const row = await errorBoundary(() =>
    db
      .deleteFrom('slackUser')
      .where('slackUser.slackWorkspaceId', '=', where.slackWorkspaceId)
      .where('slackUser.slackUserId', '=', where.slackUserId)
      .executeTakeFirstOrThrow(),
  )
  if (row instanceof Error) {
    return row
  }

  return Number(row.numDeletedRows)
}

export { deleteSlackUser }
