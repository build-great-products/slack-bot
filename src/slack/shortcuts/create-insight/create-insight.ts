import {
  type RoughOAuth2Provider,
  createNote as rapiCreateNote,
  createPerson as rapiCreatePerson,
  createReference as rapiCreateReference,
} from '@roughapp/sdk'

import type { KyselyDb, SlackUserId, SlackWorkspaceId } from '#src/database.ts'

import { getRoughAppUrl } from '#src/env.ts'

import { getSlackUser } from '#src/db/slack-user/get-slack-user.ts'

import { getOrRefreshAccessToken } from '#src/get-or-refresh-access-token.ts'

import {
  type Reply,
  failure,
  success,
  userNotIdentifiedReply,
} from '#src/reply.ts'

type CreateInsightOptions = {
  db: KyselyDb
  roughOAuth: RoughOAuth2Provider
  slackWorkspaceId: SlackWorkspaceId
  slackUserId: SlackUserId
  content: string
  referencePath?: string
  personName?: string
  originalAuthorName?: string
}

const createInsight = async (
  options: CreateInsightOptions,
): Promise<{ success: boolean; reply: Reply }> => {
  const {
    db,
    roughOAuth,
    slackWorkspaceId,
    slackUserId,
    content: originalContent,
    referencePath,
    personName,
    originalAuthorName,
  } = options

  const slackUser = await getSlackUser({
    db,
    where: { slackWorkspaceId, slackUserId },
  })
  if (slackUser instanceof Error) {
    return {
      success: false,
      reply: failure('Could not getSlackUser', slackUser),
    }
  }
  if (!slackUser) {
    return { success: false, reply: userNotIdentifiedReply }
  }

  const apiToken = await getOrRefreshAccessToken({ db, roughOAuth, slackUser })
  if (apiToken instanceof Error) {
    console.error('Could not getOrRefreshAccessToken', apiToken)
    return {
      success: false,
      reply: failure(
        'Sorry, we could not create the insight. Please use `/rough login` to reconnect your Slack account to Rough.',
        apiToken,
      ),
    }
  }

  let referenceId: string | undefined
  let personId: string | undefined

  if (referencePath) {
    const snippet =
      originalContent.length > 40
        ? `${originalContent.trim().slice(0, 40).trim()}…`
        : originalContent

    const url = new URL(referencePath, slackUser.slackWorkspaceUrl)
    const reference = await rapiCreateReference({
      baseUrl: getRoughAppUrl(),
      apiToken,
      name: `Slack: "${snippet}"`,
      url: url.toString(),
    })
    if (reference instanceof Error) {
      return {
        success: false,
        reply: failure('Could not createReference', reference),
      }
    }
    referenceId = reference.id
  }

  if (personName) {
    const person = await rapiCreatePerson({
      baseUrl: getRoughAppUrl(),
      apiToken,
      name: personName,
    })
    if (person instanceof Error) {
      return {
        success: false,
        reply: failure('Could not createPerson', person),
      }
    }
    personId = person.id
  }

  let content = originalContent
  if (originalAuthorName) {
    content = `${originalAuthorName}: ${originalContent}`
  }

  const note = await rapiCreateNote({
    baseUrl: getRoughAppUrl(),
    apiToken,
    content,
    createdByUserId: slackUser.roughUserId,
    referenceId,
    personId,
  })
  if (note instanceof Error) {
    return { success: false, reply: failure('Could not createNote', note) }
  }

  return {
    success: true,
    reply: success(
      `${content} [📌](${getRoughAppUrl()}/workspace/${slackUser.roughWorkspacePublicId}/insight/active "View in Rough")`,
    ),
  }
}

export { createInsight }
