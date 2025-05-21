import { errorBoundary } from '@stayradiated/error-boundary'
import type { DeleteResult } from 'kysely'

import type { KyselyDb, SlackInstallationId } from '#src/database.ts'

type DeleteSlackInstallationOptions = {
  db: KyselyDb
  where: {
    installationId: SlackInstallationId
  }
}

const deleteSlackInstallation = async (
  options: DeleteSlackInstallationOptions,
): Promise<DeleteResult | Error> => {
  const { db, where } = options

  return errorBoundary(() =>
    db
      .deleteFrom('slackInstallation')
      .where('id', '=', where.installationId)
      .executeTakeFirst(),
  )
}

export { deleteSlackInstallation }
