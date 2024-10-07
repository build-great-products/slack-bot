import { errorBoundary } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  SlackWorkspace,
  SlackWorkspaceId,
} from '../../database.js'

type GetSlackWorkspaceApiTokenOptions = {
  db: KyselyDb
  where: {
    slackWorkspaceId: SlackWorkspaceId
  }
}

const getSlackWorkspace = async (
  options: GetSlackWorkspaceApiTokenOptions,
): Promise<SlackWorkspace | Error> => {
  const { db, where } = options

  return errorBoundary(() =>
    db
      .selectFrom('slackWorkspace')
      .selectAll('slackWorkspace')
      .where('slackWorkspace.id', '=', where.slackWorkspaceId)
      .executeTakeFirstOrThrow(),
  )
}

export { getSlackWorkspace }
