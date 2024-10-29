import type { SlackUserId, SlackWorkspaceId } from '#src/database.ts'
import type { CommandEvent, RouteContext } from '#src/utils/define-route.ts'

import { deleteSlackUser } from '#src/db/slack-user/delete-slack-user.ts'
import { getSlackUser } from '#src/db/slack-user/get-slack-user.ts'

const handleLogout = async (event: CommandEvent, context: RouteContext) => {
  const { command, respond } = event
  const { db, roughOAuth } = context

  // Slack team/workspace ID
  const slackWorkspaceId = command.team_id as SlackWorkspaceId
  // Slack user ID of the person invoking the action
  const slackUserId = command.user_id as SlackUserId

  const slackUser = await getSlackUser({
    db,
    where: { slackWorkspaceId, slackUserId },
  })
  if (slackUser instanceof Error) {
    await respond({
      text: '😵 An error occurred while fetching your account information.',
      response_type: 'ephemeral',
    })
    return
  }
  if (!slackUser) {
    await respond({
      text: '😯 Oh, you are not currently logged in to Rough - no need to log out!',
      response_type: 'ephemeral',
    })
    return
  }

  await respond({
    text: 'Logging you out…',
    response_type: 'ephemeral',
  })

  const revokeResult = await roughOAuth.revokeToken(
    'refresh_token',
    slackUser.refreshToken,
  )
  if (revokeResult instanceof Error) {
    console.error(revokeResult)
    await respond({
      replace_original: true,
      text: '⚠️ An error occurred while logging out.',
      response_type: 'ephemeral',
    })
    return
  }

  const deleteResult = await deleteSlackUser({
    db,
    where: { slackWorkspaceId, slackUserId },
  })
  if (deleteResult instanceof Error) {
    console.error(deleteResult)
    await respond({
      replace_original: true,
      text: '⚠️ An error occurred while logging out.',
      response_type: 'ephemeral',
    })
    return
  }

  await respond({
    replace_original: true,
    text: '👋 You have been successfully logged out.',
    response_type: 'ephemeral',
  })
}

export { handleLogout }
