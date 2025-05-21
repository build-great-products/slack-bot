import { errorBoundary } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  OmitTimestamps,
  SlackInstallation,
} from '#src/database.ts'

type UpsertSlackInstallationOptions = {
  db: KyselyDb
  insert: OmitTimestamps<SlackInstallation>
  now?: number
}

const upsertSlackInstallation = async (
  options: UpsertSlackInstallationOptions,
): Promise<SlackInstallation | Error> => {
  const { db, insert, now = Date.now() } = options

  const value: SlackInstallation = {
    ...insert,
    createdAt: now,
    updatedAt: now,
  }

  return errorBoundary(() =>
    db
      .insertInto('slackInstallation')
      .values(value)
      .onConflict((oc) =>
        oc.column('id').doUpdateSet(() => ({
          value: value.value,
          updatedAt: value.updatedAt,
        })),
      )
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { upsertSlackInstallation }
