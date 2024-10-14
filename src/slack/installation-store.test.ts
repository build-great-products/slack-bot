import type { Installation } from '@slack/bolt'
import { test as anyTest, describe, expect, vi } from 'vitest'

import type { SlackInstallationId } from '#src/database.js'

import { useDb } from '#src/test/use-db.js'
import { useNow } from '#src/test/use-now.js'

import { createInstallationStore } from './installation-store.js'

const test = anyTest.extend({
  now: useNow(),
  db: useDb(),
})

describe('storeInstallation', () => {
  test('should store team installation', async ({ now, db }) => {
    const installationStore = createInstallationStore(db)

    const teamId = 'T0001' as SlackInstallationId

    const installation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: 'U123',
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
  })

  test('should store enterprise installation', async ({ now, db }) => {
    const installationStore = createInstallationStore(db)

    const enterpriseId = 'E001' as SlackInstallationId

    const installation: Installation = {
      isEnterpriseInstall: true,
      team: undefined,
      enterprise: {
        id: enterpriseId,
      },
      user: {
        id: 'U123',
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
  })

  test('should handle overwriting an existing installation', async ({
    now,
    db,
  }) => {
    const installationStore = createInstallationStore(db)

    const teamId = 'T0012' as SlackInstallationId

    const installation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: 'U123',
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
    vi.setSystemTime(now + 1000)

    const updatedInstallation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: 'U123',
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
      createdAt: now,
      updatedAt: now + 1000,
    })
  })
})

describe('fetchInstallation', () => {
  test('should fetch team installation', async ({ now, db }) => {
    const installationStore = createInstallationStore(db)

    const teamId = 'T0103' as SlackInstallationId

    const installation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: 'U123',
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
  })

  test('should fetch enterprise installation', async ({ now, db }) => {
    const installationStore = createInstallationStore(db)

    const enterpriseId = 'E002' as SlackInstallationId

    const installation: Installation = {
      isEnterpriseInstall: true,
      team: undefined,
      enterprise: {
        id: enterpriseId,
      },
      user: {
        id: 'U123',
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
  })
})

describe('deleteInstallation', () => {
  test('should delete team installation', async ({ now, db }) => {
    const installationStore = createInstallationStore(db)

    const teamId = 'T1004' as SlackInstallationId

    const installation: Installation = {
      isEnterpriseInstall: false,
      team: {
        id: teamId,
      },
      enterprise: undefined,
      user: {
        id: 'U123',
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
  })

  test('should delete enterprise installation', async ({ now, db }) => {
    const installationStore = createInstallationStore(db)

    const enterpriseId = 'E003' as SlackInstallationId

    const installation: Installation = {
      isEnterpriseInstall: true,
      team: undefined,
      enterprise: {
        id: enterpriseId,
      },
      user: {
        id: 'U123',
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
  })
})
