import { errorBoundary } from '@stayradiated/error-boundary'
import type { DeleteResult } from 'kysely'

import type {
  KyselyDb,
  SlackUserId,
  SlackUserOauthState,
  SlackWorkspaceId,
} from '#src/database.ts'

type DeleteSlackUserOauthOptions = {
  db: KyselyDb
  where:
    | {
        state: SlackUserOauthState
        slackUserId?: never
        slackWorkspaceId?: never
      }
    | {
        state?: never
        slackUserId: SlackUserId
        slackWorkspaceId: SlackWorkspaceId
      }
}

const deleteSlackUserOauth = async (
  options: DeleteSlackUserOauthOptions,
): Promise<DeleteResult | Error> => {
  const { db, where } = options

  return errorBoundary(() => {
    let q = db.deleteFrom('slackUserOauth')

    if (typeof where.state === 'string') {
      q = q.where('slackUserOauth.state', '=', where.state)
    }

    if (typeof where.slackUserId === 'string') {
      q = q.where('slackUserId', '=', where.slackUserId)
    }

    if (typeof where.slackWorkspaceId === 'string') {
      q = q.where('slackWorkspaceId', '=', where.slackWorkspaceId)
    }

    return q.executeTakeFirst()
  })
}

export { deleteSlackUserOauth }
