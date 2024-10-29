import { generateCodeVerifier, generateState } from 'arctic'

import type {
  KyselyDb,
  SlackUserId,
  SlackUserOauthState,
  SlackWorkspaceId,
} from '#src/database.ts'
import type { Reply } from '#src/reply.ts'

import { failure, text } from '#src/reply.ts'

import { upsertSlackUserOauth } from '#src/db/slack-user-oauth/upsert-slack-user-oauth.ts'

type InitiateloginOptions = {
  db: KyselyDb
  slackWorkspaceId: SlackWorkspaceId
  slackWorkspaceUrl: string
  slackUserId: SlackUserId
  slackResponseUrl?: string
}

type InitiateLoginResponse = {
  success: boolean
  reply: Reply
}

const initiateLogin = async (
  options: InitiateloginOptions,
): Promise<InitiateLoginResponse> => {
  const {
    db,
    slackWorkspaceId,
    slackWorkspaceUrl,
    slackUserId,
    slackResponseUrl,
  } = options
  const state = generateState() as SlackUserOauthState
  const codeVerifier = generateCodeVerifier()

  const slackUserOauth = await upsertSlackUserOauth({
    db,
    insert: {
      state,
      codeVerifier,
      slackWorkspaceId,
      slackWorkspaceUrl,
      slackUserId,
      slackResponseUrl: slackResponseUrl ?? null,
    },
  })
  if (slackUserOauth instanceof Error) {
    return {
      success: false,
      reply: failure('Could not upsert slack user oauth', slackUserOauth),
    }
  }

  const url = new URL('/oauth/connect', 'https://slack-development.rough.app')
  url.searchParams.set('state', state)

  return {
    success: true,
    reply: text(
      `🔐 Please <${url.toString()}|log in to your Rough account> to continue.`,
    ),
  }
}

export { initiateLogin }
