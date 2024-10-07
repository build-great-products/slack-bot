import { errorBoundary } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  OmitTimestamps,
  SlackWorkspace,
} from '../../database.js'

type UpsertSlackWorkspaceOptions = {
  db: KyselyDb
  slackWorkspace: OmitTimestamps<SlackWorkspace>
}

const upsertSlackWorkspace = async (
  options: UpsertSlackWorkspaceOptions,
): Promise<SlackWorkspace | Error> => {
  const { db, slackWorkspace } = options

  const now = Date.now()

  const value: SlackWorkspace = {
    ...slackWorkspace,
    createdAt: now,
    updatedAt: now,
  }

  return errorBoundary(() =>
    db
      .insertInto('slackWorkspace')
      .values(value)
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          ...value,
          createdAt: undefined,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { upsertSlackWorkspace }
