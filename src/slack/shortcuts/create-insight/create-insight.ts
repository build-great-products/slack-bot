import * as roughSdk from '@roughapp/sdk'
import type { RoughOAuth2Provider } from '@roughapp/sdk'

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
  originalAuthor?: {
    name: string
    email: string | undefined
  }
}

const createInsight = async (
  options: CreateInsightOptions,
): Promise<{ success: boolean; reply: Reply }> => {
  const {
    db,
    roughOAuth,
    slackWorkspaceId,
    slackUserId,
    content,
    referencePath,
    originalAuthor,
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

  if (referencePath) {
    const snippet =
      content.length > 40 ? `${content.trim().slice(0, 40).trim()}…` : content

    const url = new URL(referencePath, slackUser.slackWorkspaceUrl)
    const reference = await roughSdk.createReference({
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

  let personId: string | undefined
  if (originalAuthor) {
    // if we have an email address, upsert by email,
    // otherwise upsert by name
    if (originalAuthor.email) {
      const person = await roughSdk.upsertPersonByEmail({
        baseUrl: getRoughAppUrl(),
        apiToken,
        name: originalAuthor.name,
        email: originalAuthor.email,
      })
      if (person instanceof Error) {
        return {
          success: false,
          reply: failure('Could not createPerson', person),
        }
      }
      personId = person.id
    } else {
      const existingPersonList = await roughSdk.getPersonList({
        baseUrl: getRoughAppUrl(),
        apiToken,
        where: {
          name: originalAuthor.name,
        },
      })
      if (existingPersonList instanceof Error) {
        return {
          success: false,
          reply: failure('Could not getPersonList', existingPersonList),
        }
      }
      const existingPerson = existingPersonList.at(0)
      if (existingPerson) {
        personId = existingPerson.id
      } else {
        const person = await roughSdk.createPerson({
          baseUrl: getRoughAppUrl(),
          apiToken,
          name: originalAuthor.name,
          email: originalAuthor.email,
        })
        if (person instanceof Error) {
          return {
            success: false,
            reply: failure('Could not createPerson', person),
          }
        }
        personId = person.id
      }
    }
  }

  const note = await roughSdk.createNote({
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
