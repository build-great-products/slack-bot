import { errorBoundary } from '@stayradiated/error-boundary'

import type {
  KyselyDb,
  SlackInstallation,
  SlackInstallationId,
} from '#src/database.ts'

type GetSlackInstallationOptions = {
  db: KyselyDb
  where: {
    installationId: SlackInstallationId
  }
}

const getSlackInstallation = async (
  options: GetSlackInstallationOptions,
): Promise<SlackInstallation | undefined | Error> => {
  const { db, where } = options

  return errorBoundary(() =>
    db
      .selectFrom('slackInstallation')
      .selectAll('slackInstallation')
      .where('id', '=', where.installationId)
      .executeTakeFirst(),
  )
}

export { getSlackInstallation }
