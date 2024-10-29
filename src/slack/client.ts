import bolt from '@slack/bolt'

import type { KyselyDb } from '#src/database.ts'

import { getRoughOAuth } from '#src/get-rough-oauth.ts'

import { createInstallationStore } from '#src/slack/installation-store.ts'

type CreateClientOptions = {
  db: KyselyDb
  port: number
  slack: {
    clientId: string
    clientSecret: string
    signingSecret: string
    stateSecret: string
  }
}

const createClient = async (options: CreateClientOptions) => {
  const { db, port, slack } = options

  const roughOAuth = getRoughOAuth()

  const context = { db, roughOAuth }

  const app = new bolt.App({
    clientId: slack.clientId,
    clientSecret: slack.clientSecret,
    signingSecret: slack.signingSecret,
    stateSecret: slack.stateSecret,
    scopes: ['commands', 'reactions:write', 'users:read', 'team:read'],
    installationStore: createInstallationStore(db),
    customRoutes: (
      await Promise.all([
        import('./routes/oauth/connect/route.ts'),
        import('./routes/oauth/callback/route.ts'),
        import('./routes/oauth/callback/success/route.ts'),
      ])
    ).map((module) => module.getRoute(context)),
  })

  // register shortcut handlers
  app.shortcut(
    'create_insight',
    (
      await import('#src/slack/shortcuts/create-insight/shortcut.ts')
    ).getShortcut(context),
  )

  // register command handlers
  app.command(
    '/rough',
    (await import('#src/slack/commands/rough/command.ts')).getCommand(context),
  )

  await app.start(port)
  console.log(`⚡️ Slack app is running on port ${port}!`)
}

export { createClient }
