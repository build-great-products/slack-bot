import { errorBoundary } from '@stayradiated/error-boundary'

import type { KyselyDb, OmitTimestamps, SlackUser } from '#src/database.ts'

type UpsertSlackUserOptions = {
  db: KyselyDb
  insert: OmitTimestamps<SlackUser>
}

const upsertSlackUser = async (
  options: UpsertSlackUserOptions,
): Promise<SlackUser | Error> => {
  const { db, insert } = options

  const now = Date.now()

  const value: SlackUser = {
    ...insert,
    createdAt: now,
    updatedAt: now,
  }

  return errorBoundary(() =>
    db
      .insertInto('slackUser')
      .values(value)
      .onConflict((oc) =>
        oc.columns(['slackWorkspaceId', 'slackUserId']).doUpdateSet((eb) => ({
          accessToken: eb.ref('excluded.accessToken'),
          accessTokenExpiresAt: eb.ref('excluded.accessTokenExpiresAt'),
          name: eb.ref('excluded.name'),
          refreshToken: eb.ref('excluded.refreshToken'),
          roughUserId: eb.ref('excluded.roughUserId'),
          roughWorkspaceId: eb.ref('excluded.roughWorkspaceId'),
          roughWorkspacePublicId: eb.ref('excluded.roughWorkspacePublicId'),
          slackWorkspaceUrl: eb.ref('excluded.slackWorkspaceUrl'),
          updatedAt: eb.ref('excluded.updatedAt'),
        })),
      )
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { upsertSlackUser }
