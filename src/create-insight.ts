import type { KyselyDb, SlackWorkspaceId, UserId } from './database.js'

import { getSlackWorkspaceUser } from './db/slack-workspace-user/get-slack-workspace-user.js'
import { getSlackWorkspace } from './db/slack-workspace/get-slack-workspace.js'
import * as roughApi from './rough-api/index.js'

import {
  type Reply,
  failure,
  slackWorkspaceNotConnectedReply,
  userNotIdentifiedReply,
} from './reply.js'

type CreateInsightOptions = {
  db: KyselyDb
  slackWorkspaceId: SlackWorkspaceId
  userId: UserId
  content: string
  referencePath?: string
  customerName?: string
}

const createInsight = async (
  options: CreateInsightOptions,
): Promise<{ success: boolean; reply: Reply }> => {
  const { db, slackWorkspaceId, userId, content, referencePath, customerName } =
    options

  const slackWorkspace = await getSlackWorkspace({
    db,
    where: { slackWorkspaceId },
  })
  if (slackWorkspace instanceof Error) {
    return { success: false, reply: slackWorkspaceNotConnectedReply }
  }

  const apiToken = slackWorkspace.apiToken

  const slackWorkspaceUser = await getSlackWorkspaceUser({
    db,
    where: { slackWorkspaceId, userId },
  })
  if (slackWorkspaceUser instanceof Error) {
    return { success: false, reply: userNotIdentifiedReply }
  }

  let referenceId: string | undefined
  let customerId: string | undefined

  if (referencePath) {
    const snippet =
      content.length > 40 ? `${content.trim().slice(0, 40).trim()}…` : content

    const reference = await roughApi.createReference({
      apiToken,
      name: `Slack: "${snippet}"`,
      url: slackWorkspace.url + referencePath,
    })
    if (reference instanceof Error) {
      return {
        success: false,
        reply: failure('Could not createReference', reference),
      }
    }
    referenceId = reference.id
  }

  if (customerName) {
    const customer = await roughApi.createCustomer({
      apiToken,
      name: customerName,
    })
    if (customer instanceof Error) {
      return {
        success: false,
        reply: failure('Could not createCustomer', customer),
      }
    }
    customerId = customer.id
  }

  const note = await roughApi.createNote({
    apiToken,
    content,
    createdByUserId: slackWorkspaceUser.roughUserId,
    referenceId,
    customerId,
  })
  if (note instanceof Error) {
    return { success: false, reply: failure('Could not createNote', note) }
  }

  return {
    success: true,
    reply: {
      content: `${content} [📌](https://in.rough.app/workspace/${slackWorkspace.roughWorkspacePublicId}/insight/active "View in Rough")`,
    },
  }
}

export { createInsight }
