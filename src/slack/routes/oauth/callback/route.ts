import * as rough from '@roughapp/sdk'
import { errorBoundary } from '@stayradiated/error-boundary'

import type { SlackUserOauthState } from '#src/database.ts'

import { defineRoute } from '#src/utils/define-route.ts'
import { HttpError } from '#src/utils/error.ts'
import { loadTemplate } from '#src/utils/html-template.ts'

import { deleteSlackUserOauth } from '#src/db/slack-user-oauth/delete-slack-user-oauth.ts'
import { getSlackUserOauth } from '#src/db/slack-user-oauth/get-slack-user-oauth.ts'
import { upsertSlackUser } from '#src/db/slack-user/upsert-slack-user.ts'

const getRoute = defineRoute(
  'GET',
  '/oauth/callback',
  async (request, context) => {
    const { db, roughOAuth } = context
    const url = new URL(request.url)

    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') as SlackUserOauthState

    const errorTemplate = await loadTemplate(import.meta, './error.html')

    if (typeof code !== 'string' || typeof state !== 'string') {
      return new HttpError(
        400,
        `The 'code' and 'state' query params are required.`,
        errorTemplate,
      )
    }

    const slackUserOauth = await getSlackUserOauth({
      db,
      where: {
        state,
      },
    })
    if (slackUserOauth instanceof Error) {
      console.error(slackUserOauth)
      return new HttpError(500, 'An unexpected error occurred.', errorTemplate)
    }
    if (!slackUserOauth) {
      return new HttpError(404, 'State not found.', errorTemplate)
    }

    const tokens = await roughOAuth.validateAuthorizationCode(
      code,
      slackUserOauth.codeVerifier,
    )
    if (tokens instanceof Error) {
      console.error(tokens)
      return new HttpError(500, 'Could not validate code.', errorTemplate)
    }

    const deleteResult = await deleteSlackUserOauth({ db, where: { state } })
    if (deleteResult instanceof Error) {
      console.error(deleteResult)
      return new HttpError(500, 'Could not delete state.', errorTemplate)
    }

    const user = await rough.getUser({
      auth: tokens.accessToken,
      path: {
        userId: 'current',
      },
    })
    if (user.error) {
      console.error(user.error.message)
      return new HttpError(500, 'Could not read user.', errorTemplate)
    }

    const workspace = await rough.getWorkspace({ auth: tokens.accessToken })
    if (workspace.error) {
      console.error(workspace.error.message)
      return new HttpError(500, 'Could not read workspace.', errorTemplate)
    }

    const result = await upsertSlackUser({
      db,
      insert: {
        slackUserId: slackUserOauth.slackUserId,
        slackWorkspaceId: slackUserOauth.slackWorkspaceId,
        slackWorkspaceUrl: slackUserOauth.slackWorkspaceUrl,
        roughUserId: user.data.id,
        roughWorkspaceId: workspace.data.id,
        roughWorkspacePublicId: workspace.data.publicId,
        name: user.data.name ?? '',
        accessToken: tokens.accessToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        refreshToken: tokens.refreshToken,
      },
    })
    if (result instanceof Error) {
      console.error(result)
      return new HttpError(500, 'Could not save tokens.', errorTemplate)
    }

    const { slackResponseUrl } = slackUserOauth
    if (slackResponseUrl) {
      const response = await errorBoundary(() =>
        fetch(slackResponseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: '✅ Successfully connected Rough to Slack.',
            response_type: 'ephemeral',
          }),
        }),
      )
      if (response instanceof Error) {
        console.error(response)
      }
    }

    return new Response('', {
      status: 302,
      headers: {
        location: '/oauth/callback/success',
      },
    })
  },
)

export { getRoute }
