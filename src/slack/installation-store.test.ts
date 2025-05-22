import type { Installation } from '@slack/bolt'
import { assertOk } from '@stayradiated/error-boundary'
import { test as anyTest, describe, expect } from 'vitest'

import type { SlackInstallationId, SlackUserId } from '#src/database.ts'

import { useDb } from '#src/test/use-db.ts'
import { useNow } from '#src/test/use-now.ts'

import { genId } from '#src/utils/gen-id.ts'

import { deleteSlackInstallation } from '#src/db/slack-installation/delete-slack-installation.ts'

import { createInstallationStore } from './installation-store.ts'

const test = anyTest.extend({
  now: useNow(),
  db: useDb(),
})

describe('storeInstallation', () => {
  test('should store team installation', async ({ now, db }) => {
    const installationStore = createInstallationStore({
      db,
      getCurrentTime: () => now,
    })

    const teamId = genId<SlackInstallationId>()
    const userId = genId<SlackUserId>()

    const installation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: userId,
        token: 'xoxb-123',
        scopes: [],
      },
    }

    await installationStore.storeInstallation(installation)

    const row = await db
      .selectFrom('slackInstallation')
      .selectAll('slackInstallation')
      .where('id', '=', teamId)
      .executeTakeFirstOrThrow()

    expect(row).toEqual({
      id: teamId,
      value: JSON.stringify(installation),
      createdAt: now,
      updatedAt: now,
    })

    // cleanup
    assertOk(
      await deleteSlackInstallation({ db, where: { installationId: teamId } }),
    )
  })

  test('should store enterprise installation', async ({ now, db }) => {
    const installationStore = createInstallationStore({
      db,
      getCurrentTime: () => now,
    })

    const enterpriseId = genId<SlackInstallationId>()
    const userId = genId<SlackUserId>()

    const installation: Installation = {
      isEnterpriseInstall: true,
      team: undefined,
      enterprise: {
        id: enterpriseId,
      },
      user: {
        id: userId,
        token: 'xoxb-123',
        scopes: [],
      },
    }

    await installationStore.storeInstallation(installation)

    const row = await db
      .selectFrom('slackInstallation')
      .selectAll('slackInstallation')
      .where('id', '=', enterpriseId)
      .executeTakeFirstOrThrow()

    expect(row).toEqual({
      id: enterpriseId,
      value: JSON.stringify(installation),
      createdAt: now,
      updatedAt: now,
    })

    // cleanup
    assertOk(
      await deleteSlackInstallation({
        db,
        where: { installationId: enterpriseId },
      }),
    )
  })

  test('should handle overwriting an existing installation', async ({
    now,
    db,
  }) => {
    const installationStore = createInstallationStore({
      db,
      getCurrentTime: () => now,
    })

    const teamId = genId<SlackInstallationId>()
    const userId = genId<SlackUserId>()

    const installation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: userId,
        token: 'xoxb-123',
        scopes: [],
      },
    }

    await db
      .insertInto('slackInstallation')
      .values({
        id: teamId,
        value: JSON.stringify(installation),
        createdAt: now,
        updatedAt: now,
      })
      .execute()

    // move clock forward
    now += 1000

    const updatedInstallation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: userId,
        token: 'xoxb-456',
        scopes: [],
      },
    }

    await installationStore.storeInstallation(updatedInstallation)

    const row = await db
      .selectFrom('slackInstallation')
      .selectAll('slackInstallation')
      .where('id', '=', teamId)
      .executeTakeFirstOrThrow()

    expect(row).toEqual({
      id: teamId,
      value: JSON.stringify(updatedInstallation),
      createdAt: now - 1000,
      updatedAt: now,
    })

    // cleanup
    assertOk(
      await deleteSlackInstallation({ db, where: { installationId: teamId } }),
    )
  })
})

describe('fetchInstallation', () => {
  test('should fetch team installation', async ({ now, db }) => {
    const installationStore = createInstallationStore({
      db,
      getCurrentTime: () => now,
    })

    const teamId = genId<SlackInstallationId>()
    const userId = genId<SlackUserId>()

    const installation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: userId,
        token: 'xoxb-123',
        scopes: [],
      },
    }

    await db
      .insertInto('slackInstallation')
      .values({
        id: teamId,
        value: JSON.stringify(installation),
        createdAt: now,
        updatedAt: now,
      })
      .execute()

    const fetchedInstallation = await installationStore.fetchInstallation({
      isEnterpriseInstall: false,
      teamId,
      enterpriseId: undefined,
    })

    expect(fetchedInstallation).toEqual(installation)

    // cleanup
    assertOk(
      await deleteSlackInstallation({ db, where: { installationId: teamId } }),
    )
  })

  test('should fetch enterprise installation', async ({ now, db }) => {
    const installationStore = createInstallationStore({
      db,
      getCurrentTime: () => now,
    })

    const enterpriseId = genId<SlackInstallationId>()
    const userId = genId<SlackUserId>()

    const installation: Installation = {
      isEnterpriseInstall: true,
      team: undefined,
      enterprise: {
        id: enterpriseId,
      },
      user: {
        id: userId,
        token: 'xoxb-123',
        scopes: [],
      },
    }

    await db
      .insertInto('slackInstallation')
      .values({
        id: enterpriseId,
        value: JSON.stringify(installation),
        createdAt: now,
        updatedAt: now,
      })
      .execute()

    const fetchedInstallation = await installationStore.fetchInstallation({
      isEnterpriseInstall: true,
      enterpriseId,
      teamId: undefined,
    })

    expect(fetchedInstallation).toEqual(installation)

    // cleanup
    assertOk(
      await deleteSlackInstallation({
        db,
        where: { installationId: enterpriseId },
      }),
    )
  })
})

describe('deleteInstallation', () => {
  test('should delete team installation', async ({ now, db }) => {
    const installationStore = createInstallationStore({
      db,
      getCurrentTime: () => now,
    })

    const teamId = genId<SlackInstallationId>()
    const userId = genId<SlackUserId>()

    const installation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: userId,
        token: 'xoxb-123',
        scopes: [],
      },
    }

    await db
      .insertInto('slackInstallation')
      .values({
        id: teamId,
        value: JSON.stringify(installation),
        createdAt: now,
        updatedAt: now,
      })
      .execute()

    await installationStore.deleteInstallation?.({
      isEnterpriseInstall: false,
      teamId,
      enterpriseId: undefined,
    })

    const row = await db
      .selectFrom('slackInstallation')
      .selectAll('slackInstallation')
      .where('id', '=', teamId)
      .executeTakeFirst()

    expect(row).toBeUndefined()

    // cleanup
    assertOk(
      await deleteSlackInstallation({ db, where: { installationId: teamId } }),
    )
  })

  test('should delete enterprise installation', async ({ now, db }) => {
    const installationStore = createInstallationStore({
      db,
      getCurrentTime: () => now,
    })

    const enterpriseId = genId<SlackInstallationId>()
    const userId = genId<SlackUserId>()

    const installation: Installation = {
      isEnterpriseInstall: true,
      team: undefined,
      enterprise: {
        id: enterpriseId,
      },
      user: {
        id: userId,
        token: 'xoxb-123',
        scopes: [],
      },
    }

    await db
      .insertInto('slackInstallation')
      .values({
        id: enterpriseId,
        value: JSON.stringify(installation),
        createdAt: now,
        updatedAt: now,
      })
      .execute()

    await installationStore.deleteInstallation?.({
      isEnterpriseInstall: true,
      enterpriseId,
      teamId: undefined,
    })

    const row = await db
      .selectFrom('slackInstallation')
      .selectAll('slackInstallation')
      .where('id', '=', enterpriseId)
      .executeTakeFirst()

    expect(row).toBeUndefined()

    // cleanup
    assertOk(
      await deleteSlackInstallation({
        db,
        where: { installationId: enterpriseId },
      }),
    )
  })
})
