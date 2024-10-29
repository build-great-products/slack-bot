import type { SlackUserOauthState } from '#src/database.ts'
import { defineRoute } from '#src/utils/define-route.ts'
import { HttpError } from '#src/utils/error.ts'
import { loadTemplate } from '#src/utils/html-template.ts'

import { getSlackUserOauth } from '#src/db/slack-user-oauth/get-slack-user-oauth.ts'

const getRoute = defineRoute(
  'GET',
  '/oauth/connect',
  async (request, context) => {
    const { db, roughOAuth } = context
    const url = new URL(request.url)

    const errorTemplate = await loadTemplate(import.meta, './error.html')

    const state = url.searchParams.get('state') as
      | SlackUserOauthState
      | undefined
    if (typeof state !== 'string') {
      return new HttpError(
        400,
        "The 'state' query param is required.",
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
      return new HttpError(
        404,
        'Sorry, the link you used has expired. Please return to slack and use this command:\n\n  /rough login',
        errorTemplate,
      )
    }

    const authorizationUrl = roughOAuth.createAuthorizationURL(
      slackUserOauth.state,
      slackUserOauth.codeVerifier,
      ['read:workspace', 'write:workspace'],
    )

    return new Response('', {
      status: 302,
      headers: {
        location: authorizationUrl.toString(),
      },
    })
  },
)

export { getRoute }
