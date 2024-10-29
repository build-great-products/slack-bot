import { errorBoundary } from '@stayradiated/error-boundary'

import type { KyselyDb, OmitTimestamps, SlackUserOauth } from '#src/database.ts'

type UpsertSlackUserOauthOptions = {
  db: KyselyDb
  insert: OmitTimestamps<SlackUserOauth>
}

const upsertSlackUserOauth = async (
  options: UpsertSlackUserOauthOptions,
): Promise<SlackUserOauth | Error> => {
  const { db, insert } = options

  const now = Date.now()

  const value: SlackUserOauth = {
    ...insert,
    createdAt: now,
    updatedAt: now,
  }

  return errorBoundary(() =>
    db
      .insertInto('slackUserOauth')
      .values(value)
      .onConflict((oc) =>
        oc.column('state').doUpdateSet((eb) => ({
          slackUserId: eb.ref('excluded.slackUserId'),
          slackWorkspaceId: eb.ref('excluded.slackWorkspaceId'),
          slackWorkspaceUrl: eb.ref('excluded.slackWorkspaceUrl'),
          slackResponseUrl: eb.ref('excluded.slackResponseUrl'),
          codeVerifier: eb.ref('excluded.codeVerifier'),
          updatedAt: eb.ref('excluded.updatedAt'),
        })),
      )
      .returningAll()
      .executeTakeFirstOrThrow(),
  )
}

export { upsertSlackUserOauth }
