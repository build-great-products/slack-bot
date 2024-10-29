import { errorBoundary } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  OmitTimestamps,
  SlackUser,
  SlackUserId,
  SlackWorkspaceId,
} from '#src/database.ts'

type UpdateSlackUserOptions = {
  db: KyselyDb
  where: {
    slackUserId: SlackUserId
    slackWorkspaceId: SlackWorkspaceId
  }
  set: Partial<
    Omit<OmitTimestamps<SlackUser>, 'slackUserId' | 'slackWorkspaceId'>
  >
}

const updateSlackUser = async (
  options: UpdateSlackUserOptions,
): Promise<SlackUser | Error> => {
  const { db, where, set } = options

  const now = Date.now()

  return errorBoundary(() =>
    db
      .updateTable('slackUser')
      .set({
        ...set,
        updatedAt: now,
      })
      .where('slackUserId', '=', where.slackUserId)
      .where('slackWorkspaceId', '=', where.slackWorkspaceId)
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { updateSlackUser }
