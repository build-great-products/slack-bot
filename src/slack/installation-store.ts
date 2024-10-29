import type {
  Installation,
  InstallationQuery,
  InstallationStore,
} from '@slack/bolt'
import { errorBoundary } from '@stayradiated/error-boundary'

import type { KyselyDb } from '#src/database.ts'
import type { SlackInstallationId } from '#src/database.ts'

const getInstallationId = (
  installation: Installation | InstallationQuery<boolean>,
): SlackInstallationId => {
  let installationId: string

  if (installation.isEnterpriseInstall) {
    if ('enterpriseId' in installation && installation.enterpriseId) {
      installationId = installation.enterpriseId
    } else if ('enterprise' in installation && installation.enterprise) {
      installationId = installation.enterprise.id
    } else {
      throw new Error(
        'Could not determine installation ID for enterprise installation',
      )
    }
  } else {
    if ('teamId' in installation && installation.teamId) {
      installationId = installation.teamId
    } else if ('team' in installation && installation.team) {
      installationId = installation.team.id
    } else {
      throw new Error(
        'Could not determine installation ID for single team installation',
      )
    }
  }

  return installationId as SlackInstallationId
}

const createInstallationStore = (db: KyselyDb): InstallationStore => {
  return {
    storeInstallation: async (installation) => {
      const installationId = getInstallationId(installation)

      const result = await errorBoundary(() =>
        db
          .insertInto('slackInstallation')
          .values({
            id: installationId,
            value: JSON.stringify(installation),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
          .onConflict((oc) =>
            oc.doUpdateSet({
              value: JSON.stringify(installation),
              updatedAt: Date.now(),
            }),
          )
          .execute(),
      )
      if (result instanceof Error) {
        console.error(result)
        throw new Error('Failed saving installation data to installationStore')
      }
    },
    fetchInstallation: async (installQuery) => {
      const installationId = getInstallationId(installQuery)

      const installation = await errorBoundary(async () => {
        const row = await db
          .selectFrom('slackInstallation')
          .select('value')
          .where('id', '=', installationId)
          .executeTakeFirstOrThrow()

        return JSON.parse(row.value) as Installation
      })
      if (installation instanceof Error) {
        console.error(installation)
        throw new Error('Failed fetching installation')
      }

      return installation
    },
    deleteInstallation: async (installQuery) => {
      const installationId = getInstallationId(installQuery)

      const result = await errorBoundary(() =>
        db
          .deleteFrom('slackInstallation')
          .where('id', '=', installationId)
          .execute(),
      )
      if (result instanceof Error) {
        console.error(result)
        throw new Error('Failed to delete installation')
      }
    },
  }
}

export { createInstallationStore }
