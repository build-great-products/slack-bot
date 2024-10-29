import { errorBoundary } from '@stayradiated/error-boundary'
import type { DeleteResult } from 'kysely'

import type { KyselyDb, SlackUserOauthState } from '#src/database.ts'

type DeleteSlackUserOauthApiTokenOptions = {
  db: KyselyDb
  where: {
    state: SlackUserOauthState
  }
}

const deleteSlackUserOauth = async (
  options: DeleteSlackUserOauthApiTokenOptions,
): Promise<DeleteResult | Error> => {
  const { db, where } = options

  return errorBoundary(() =>
    db
      .deleteFrom('slackUserOauth')
      .where('slackUserOauth.state', '=', where.state)
      .executeTakeFirst(),
  )
}

export { deleteSlackUserOauth }
