import type {
  Installation,
  InstallationQuery,
  InstallationStore,
} from '@slack/bolt'

import type { KyselyDb } from '#src/database.ts'
import type { SlackInstallationId } from '#src/database.ts'

import { deleteSlackInstallation } from '#src/db/slack-installation/delete-slack-installation.ts'
import { getSlackInstallation } from '#src/db/slack-installation/get-slack-installation.ts'
import { upsertSlackInstallation } from '#src/db/slack-installation/upsert-slack-installation.ts'

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

type CreateInstallationStoreOptions = {
  db: KyselyDb
  getCurrentTime?: () => number
}

const createInstallationStore = (
  options: CreateInstallationStoreOptions,
): InstallationStore => {
  const { db, getCurrentTime = () => Date.now() } = options
  return {
    storeInstallation: async (installation) => {
      const installationId = getInstallationId(installation)
      const result = await upsertSlackInstallation({
        db,
        insert: {
          id: installationId,
          value: JSON.stringify(installation),
        },
        now: getCurrentTime(),
      })
      if (result instanceof Error) {
        console.error(result)
        throw new Error(
          'Failed saving installation data to installationStore',
          {
            cause: result,
          },
        )
      }
    },
    fetchInstallation: async (installQuery) => {
      const installationId = getInstallationId(installQuery)

      const installation = await getSlackInstallation({
        db,
        where: {
          installationId: installationId,
        },
      })
      if (installation instanceof Error) {
        console.error(installation)
        throw new Error('Failed fetching installation', {
          cause: installation,
        })
      }
      if (!installation) {
        throw new Error('Failed fetching installation')
      }

      return JSON.parse(installation.value)
    },
    deleteInstallation: async (installQuery) => {
      const installationId = getInstallationId(installQuery)

      const result = await deleteSlackInstallation({
        db,
        where: {
          installationId,
        },
      })
      if (result instanceof Error) {
        console.error(result)
        throw new Error('Failed to delete installation', {
          cause: result,
        })
      }
    },
  }
}

export { createInstallationStore }
