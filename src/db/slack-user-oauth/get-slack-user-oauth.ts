import { errorBoundary } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  SlackUserOauth,
  SlackUserOauthState,
} from '#src/database.ts'

type GetSlackUserOauthApiTokenOptions = {
  db: KyselyDb
  where: {
    state: SlackUserOauthState
  }
}

const getSlackUserOauth = async (
  options: GetSlackUserOauthApiTokenOptions,
): Promise<SlackUserOauth | undefined | Error> => {
  const { db, where } = options

  return errorBoundary(() =>
    db
      .selectFrom('slackUserOauth')
      .selectAll('slackUserOauth')
      .where('slackUserOauth.state', '=', where.state)
      .executeTakeFirst(),
  )
}

export { getSlackUserOauth }
