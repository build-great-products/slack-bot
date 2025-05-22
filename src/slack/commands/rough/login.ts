import type { SlackUserId, SlackWorkspaceId } from '#src/database.ts'
import type { CommandEvent, RouteContext } from '#src/utils/define-route.ts'

import { getSlackUser } from '#src/db/slack-user/get-slack-user.ts'
import { initiateLogin } from '#src/initiate-login.ts'

const handleLogin = async (event: CommandEvent, context: RouteContext) => {
  const { client, command, respond } = event
  const { db } = context

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
  if (slackUser) {
    await respond({
      text: '😯 You are already logged in to Rough as - no need to log in again! If you would like to log in as a different user, please `/rough logout` first.',
      response_type: 'ephemeral',
    })
    return
  }

  // Fetch team info to get the workspace domain
  const teamInfo = await client.team.info()

  if (!teamInfo.ok || !teamInfo.team) {
    await respond({
      text: 'Failed to get workspace info. Please try again later.',
      response_type: 'ephemeral',
    })
    return
  }
  const slackWorkspaceUrl = `https://${teamInfo.team.domain}.slack.com`

  const { reply } = await initiateLogin({
    db,
    slackUserId,
    slackWorkspaceId,
    slackWorkspaceUrl,
    slackResponseUrl: command.response_url,
  })

  await respond(reply)
}

export { handleLogin }
