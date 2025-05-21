import { errorBoundary } from '@stayradiated/error-boundary'

import type { KyselyDb, SlackUserId, SlackWorkspaceId } from '#src/database.ts'

import { deleteSlackUserOauth } from '#src/db/slack-user-oauth/delete-slack-user-oauth.ts'

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

  // remove any linked oauth records first
  const slackUserOauthResult = await deleteSlackUserOauth({
    db,
    where: {
      slackUserId: where.slackUserId,
      slackWorkspaceId: where.slackWorkspaceId,
    },
  })
  if (slackUserOauthResult instanceof Error) {
    return new Error('Could not deleteSlackUserOauth', {
      cause: slackUserOauthResult,
    })
  }

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
