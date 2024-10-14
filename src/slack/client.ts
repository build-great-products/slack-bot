import bolt from '@slack/bolt'
import { z } from 'zod'

import type { KyselyDb, SlackWorkspaceId, UserId } from '#src/database.js'

import { createInsight } from '#src/create-insight.js'
import { upsertSlackWorkspaceUser } from '#src/db/slack-workspace-user/upsert-slack-workspace-user.js'
import { getSlackWorkspace } from '#src/db/slack-workspace/get-slack-workspace.js'
import { upsertSlackWorkspace } from '#src/db/slack-workspace/upsert-slack-workspace.js'
import * as roughApi from '#src/rough-api/index.js'

import { createInstallationStore } from '#src/slack/installation-store.js'

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

  const app = new bolt.App({
    clientId: slack.clientId,
    clientSecret: slack.clientSecret,
    signingSecret: slack.signingSecret,
    stateSecret: slack.stateSecret,
    scopes: ['commands', 'reactions:write', 'users:read', 'team:read'],
    installationStore: createInstallationStore(db),
  })

  const { client } = app

  app.command('/rough-connect', async ({ command, ack, respond }) => {
    // Acknowledge the command request
    await ack()

    const apiToken = command.text.trim()
    if (!apiToken) {
      await respond({
        text: 'You must specify an API token.',
        response_type: 'ephemeral', // This ensures only the user who typed the command sees the message
      })
      return
    }

    try {
      // Fetch team info to get the workspace domain
      const teamInfo = await client.team.info()

      if (!teamInfo.ok || !teamInfo.team) {
        await respond({
          text: 'Failed to get workspace info. Please try again later.',
          response_type: 'ephemeral',
        })
        return
      }
      const workspaceUrl = `https://${teamInfo.team.domain}.slack.com`

      // Call Rough API to get the current workspace
      const roughWorkspace = await roughApi.getCurrentWorkspace({ apiToken })

      if (roughWorkspace instanceof Error) {
        await respond({
          text: `API Token could not be used to retrieve Workspace details. Error: ${roughWorkspace.message}`,
          response_type: 'ephemeral',
        })
        return
      }

      // Upsert guild (equivalent to updating a Slack workspace)
      const slackWorkspaceId = command.team_id as SlackWorkspaceId
      const slackWorkspace = await upsertSlackWorkspace({
        db,
        slackWorkspace: {
          id: slackWorkspaceId,
          roughWorkspaceId: roughWorkspace.id,
          roughWorkspacePublicId: roughWorkspace.publicId,
          name: roughWorkspace.name,
          apiToken,
          url: workspaceUrl,
        },
      })

      if (slackWorkspace instanceof Error) {
        await respond({
          text: `Could not upsert Slack Workspace info. Error: ${slackWorkspace.message}`,
          response_type: 'ephemeral',
        })
        return
      }

      // Respond with success message
      await respond({
        text: `✅ Successfully connected to Rough workspace "${roughWorkspace.name}" \`${roughWorkspace.id}\``,
        response_type: 'ephemeral',
      })
    } catch (error) {
      console.error('Error processing the command:', error)
      await respond({
        text: 'Something went wrong. Please try again later.',
        response_type: 'ephemeral',
      })
    }
  })

  const $PrivateMetadata = z.object({
    user_id: z.string(),
    channel_id: z.string(),
  })
  type PrivateMetadata = z.infer<typeof $PrivateMetadata>

  app.command('/rough-identify', async ({ ack, command }) => {
    await ack()

    // Open a modal with a dynamic dropdown (external select)
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'identify_modal',
        title: {
          type: 'plain_text',
          text: 'Select your Rough User',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'rough_user_select',
            element: {
              type: 'external_select',
              action_id: 'rough_user_select', // Matches the action_id in app.options()
              placeholder: {
                type: 'plain_text',
                text: 'Select a user',
              },
              min_query_length: 0, // Triggers the options callback after typing one character
              focus_on_load: true,
            },
            label: {
              type: 'plain_text',
              text: 'Rough User',
            },
          },
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit',
        },
        private_metadata: JSON.stringify({
          user_id: command.user_id,
          channel_id: command.channel_id,
        } satisfies PrivateMetadata),
      },
    })
  })

  // Listen for the 'options' request from the external select
  app.options('rough_user_select', async ({ options, ack, body }) => {
    const slackWorkspaceId = body.team?.id as SlackWorkspaceId
    const searchTerm = options.value.trim() // The value that the user has typed in the select input

    // Get the guild (workspace) details from your database
    const slackWorkspace = await getSlackWorkspace({
      db,
      where: { slackWorkspaceId },
    })

    if (slackWorkspace instanceof Error) {
      await ack({
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'This workspace is not yet connected to Rough. Please use `/rough-connect` to connect it.',
            },
            value: '-',
          },
        ],
      })
      return
    }

    // Fetch the user list from the Rough API using the guild's API token
    const userList = await roughApi.getUserList({
      apiToken: slackWorkspace.apiToken,
    })
    if (userList instanceof Error) {
      await ack({
        options: [
          {
            text: {
              type: 'plain_text',
              text: '⚠️ Failed to get user list.',
            },
            value: '-',
          },
        ],
      })
      return
    }

    // Filter the user list based on the user's search term
    const filteredUserList = userList.filter((user) =>
      user.name?.toLowerCase().startsWith(searchTerm.toLowerCase()),
    )

    // Respond with the filtered user list
    await ack({
      options: filteredUserList.map((user) => ({
        text: {
          type: 'plain_text',
          text: user.name ?? 'Unknown User',
        },
        value: user.id,
      })),
    })
  })

  app.view('identify_modal', async ({ ack, view, body }) => {
    const privateMetadata = $PrivateMetadata.parse(
      JSON.parse(view.private_metadata),
    )

    // Acknowledge the command request
    await ack()

    const roughUserId =
      view.state.values.rough_user_select.rough_user_select.selected_option
        ?.value

    if (typeof roughUserId !== 'string') {
      await client.chat.postEphemeral({
        user: privateMetadata.user_id,
        channel: privateMetadata.channel_id,
        text: 'You must specify a Rough User ID.',
      })
      return
    }

    const slackWorkspaceId = view.team_id as SlackWorkspaceId // Slack team (workspace) ID
    const userId = body.user.id as UserId // Slack user ID of the person running the command

    try {
      // Fetch the Slack Workspace details from the database
      const slackWorkspace = await getSlackWorkspace({
        db,
        where: { slackWorkspaceId },
      })

      if (slackWorkspace instanceof Error) {
        await client.chat.postEphemeral({
          user: privateMetadata.user_id,
          channel: privateMetadata.channel_id,
          text: 'This Slack workspace is not yet connected to Rough. Please use the `/rough-connect` command to connect it.',
        })
        return
      }

      // Fetch user info from Rough API
      const user = await roughApi.getUser({
        apiToken: slackWorkspace.apiToken,
        userId: roughUserId,
      })

      if (user instanceof Error) {
        await client.chat.postEphemeral({
          user: privateMetadata.user_id,
          channel: privateMetadata.channel_id,
          text: `Could not find a user with ID \`${roughUserId}\` in Rough workspace "${slackWorkspace.name}".`,
        })
        return
      }

      // Upsert the user info in your local database
      const slackWorkspaceUser = await upsertSlackWorkspaceUser({
        db,
        slackWorkspaceUser: {
          slackWorkspaceId,
          userId, // Slack user ID
          roughUserId,
          name: user.name ?? '',
        },
      })

      if (slackWorkspaceUser instanceof Error) {
        await client.chat.postEphemeral({
          user: privateMetadata.user_id,
          channel: privateMetadata.channel_id,
          text: `Could not upsert Guild User info. Error: ${slackWorkspaceUser.message}`,
        })
        return
      }

      // Respond with a success message
      await client.chat.postEphemeral({
        user: privateMetadata.user_id,
        channel: privateMetadata.channel_id,
        text: `✅ Identified as Rough user ${user.name} (${user.email})`,
      })
    } catch (error) {
      console.error('Error processing the command:', error)
      await client.chat.postEphemeral({
        user: privateMetadata.user_id,
        channel: privateMetadata.channel_id,
        text: 'Something went wrong. Please try again later.',
      })
    }
  })

  app.shortcut('create_insight', async ({ shortcut, body, ack, respond }) => {
    if (shortcut.type !== 'message_action') {
      throw new Error('flail')
    }
    if (!shortcut.team) {
      throw new Error('flail')
    }

    // Acknowledge the shortcut
    await ack()

    const { message, channel } = shortcut
    if (!message || !message.text || message.text.trim().length === 0) {
      await respond({
        text: 'The insight text cannot be empty.',
        response_type: 'ephemeral',
      })
      return
    }

    // Fetch the author's user info from Slack
    const authorId = message.user
    let authorName = 'Unknown User'
    if (typeof authorId === 'string') {
      const authorInfo = await client.users.info({ user: authorId })
      authorName =
        authorInfo.user?.real_name || authorInfo.user?.name || 'Unknown User'
    }

    // Optionally, modify the message content if it's not authored by the user submitting the insight
    let content = message.text
    if (authorId !== body.user.id) {
      content = `${authorName} said: ${content}`
    }

    // Generate the reference URL for the message
    const referencePath = `/archives/${channel.id}/p${message.ts.replace('.', '')}`

    // Call the createInsight function (adapted for Slack)
    const { success, reply } = await createInsight({
      db: db, // Database connection
      slackWorkspaceId: body.team?.id as SlackWorkspaceId, // Slack team/workspace ID
      userId: body.user.id as UserId, // Slack user ID of the person invoking the action
      content,
      referencePath,
    })

    if (success) {
      // Add a 📌 reaction to pin the message
      void client.reactions.add({
        channel: channel.id,
        name: 'pushpin',
        timestamp: message.ts,
      })

      // Respond with success message
      await respond({
        text: '✅ Captured insight successfully.',
        response_type: 'ephemeral',
      })
    } else {
      // Handle failure
      await respond(reply)
    }
  })

  await app.start(port)
  console.log(`⚡️ Slack app is running on port ${port}!`)
}

export { createClient }
