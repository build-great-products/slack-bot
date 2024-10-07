import { errorBoundary } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  OmitTimestamps,
  SlackWorkspaceUser,
} from '../../database.js'

type UpsertSlackWorkspaceUserOptions = {
  db: KyselyDb
  slackWorkspaceUser: OmitTimestamps<SlackWorkspaceUser>
}

const upsertSlackWorkspaceUser = async (
  options: UpsertSlackWorkspaceUserOptions,
): Promise<SlackWorkspaceUser | Error> => {
  const { db, slackWorkspaceUser } = options

  const now = Date.now()

  const value: SlackWorkspaceUser = {
    ...slackWorkspaceUser,
    createdAt: now,
    updatedAt: now,
  }

  return errorBoundary(() =>
    db
      .insertInto('slackWorkspaceUser')
      .values(value)
      .onConflict((oc) =>
        oc.columns(['slackWorkspaceId', 'userId']).doUpdateSet({
          ...value,
          createdAt: undefined,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { upsertSlackWorkspaceUser }
