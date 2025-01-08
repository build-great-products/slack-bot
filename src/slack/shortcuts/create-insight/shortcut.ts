import type { webApi } from '@slack/bolt'
import { errorBoundary } from '@stayradiated/error-boundary'

import type { SlackUserId, SlackWorkspaceId } from '#src/database.ts'
import { initiateLogin } from '#src/initiate-login.ts'

import { createLookupUserIdFn } from '#src/slack/lookup-user-id.ts'
import { getMessageText } from '#src/slack/message.ts'

import { failure, success, warning } from '#src/reply.ts'

import type {
  RouteContext,
  ShortcutHandlerFn,
} from '#src/utils/define-route.ts'

import { createInsight } from './create-insight.ts'

import { getSlackUser } from '#src/db/slack-user/get-slack-user.ts'

const getShortcut =
  (context: RouteContext): ShortcutHandlerFn =>
  async (event) => {
    const { db, roughOAuth } = context
    const { client, shortcut, body, ack, respond } = event

    // Acknowledge the shortcut
    await ack()

    if (shortcut.type !== 'message_action') {
      await respond(failure('This shortcut can only be used on messages.'))
      return
    }

    if (!shortcut.team) {
      await respond(failure('This shortcut can only be used in a workspace.'))
      return
    }

    // Slack team/workspace ID
    const slackWorkspaceId = shortcut.team.id as SlackWorkspaceId
    // Slack user ID of the person invoking the action
    const slackUserId = shortcut.user.id as SlackUserId

    const slackuser = await getSlackUser({
      db,
      where: { slackWorkspaceId, slackUserId },
    })
    if (slackuser instanceof Error) {
      await respond(
        failure('An error occurred while fetching your account information.'),
      )
      return
    }
    if (!slackuser) {
      // Fetch team info to get the workspace domain
      const teamInfo = await client.team.info()

      if (!teamInfo.ok || !teamInfo.team) {
        await respond(
          failure('Failed to get workspace info. Please try again later.'),
        )
        return
      }
      const slackWorkspaceUrl = `https://${teamInfo.team.domain}.slack.com`

      const { reply } = await initiateLogin({
        db,
        slackUserId,
        slackWorkspaceId,
        slackWorkspaceUrl,
        slackResponseUrl: shortcut.response_url,
      })
      await respond(reply)
      return
    }

    const { message, channel } = shortcut
    if (!message || !message.text || message.text.trim().length === 0) {
      await respond(warning('The insight text cannot be empty.'))
      return
    }

    const lookupUserId = createLookupUserIdFn(client)

    // Resolve user mentions in the message text
    const content = await getMessageText({
      lookupUserId,
      messageText: message.text,
    })

    // Optionally, modify the message content if it's not authored by the user submitting the insight
    let originalAuthor:
      | {
          name: string
          email: string | undefined
          imageUrl: string | undefined
        }
      | undefined
    const messageAuthorUserId = message.user as SlackUserId | undefined
    if (messageAuthorUserId && messageAuthorUserId !== slackuser.slackUserId) {
      const profile = await lookupUserId(messageAuthorUserId)
      if (profile instanceof Error) {
        console.error(profile)
      } else {
        originalAuthor = {
          name: profile.displayName ?? profile.realName ?? 'Anonymous',
          email: profile.email,
          imageUrl: profile.imageUrl,
        }
      }
    }

    // Generate the reference URL for the message
    const referencePath = `/archives/${channel.id}/p${message.ts.replace('.', '')}`

    // Call the createInsight function (adapted for Slack)
    const { success: isSuccess, reply } = await createInsight({
      db,
      roughOAuth,
      slackWorkspaceId: body.team?.id as SlackWorkspaceId,
      slackUserId: body.user.id as SlackUserId,
      content,
      referencePath,
      originalAuthor,
    })

    if (isSuccess) {
      // Add a 📌 reaction to pin the message
      const reactionResult = await errorBoundary(() =>
        client.reactions.add({
          channel: channel.id,
          name: 'pushpin',
          timestamp: message.ts,
        }),
      )
      if (reactionResult instanceof Error) {
        let isHandled = false
        if ('data' in reactionResult) {
          const apiError = reactionResult as webApi.WebAPIPlatformError
          if (apiError.data.error === 'already_reacted') {
            // ignore if the message is already pinned
            isHandled = true
          }
        }
        if (!isHandled) {
          console.error(reactionResult)
        }
      }

      // Respond with success message
      await respond(success('Captured insight successfully.'))
    } else {
      // Handle failure
      await respond(reply)
    }
  }

export { getShortcut }
