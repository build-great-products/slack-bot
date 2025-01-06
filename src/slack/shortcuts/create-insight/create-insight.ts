import * as rough from '@roughapp/sdk'
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
    const reference = await rough.createReference({
      baseUrl: getRoughAppUrl(),
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: {
        name: `Slack: "${snippet}"`,
        url: url.toString(),
      },
    })
    if (reference.error) {
      return {
        success: false,
        reply: failure('Could not createReference', reference.error.message),
      }
    }
    referenceId = reference.data.id
  }

  let personId: string | undefined
  if (originalAuthor) {
    // if we have an email address, upsert by email,
    // otherwise upsert by name
    if (originalAuthor.email) {
      const person = await rough.upsertPerson({
        baseUrl: getRoughAppUrl(),
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
        path: {
          email: originalAuthor.email,
        },
        body: {
          name: originalAuthor.name,
        },
      })
      if (person.error) {
        return {
          success: false,
          reply: failure('Could not createPerson', person.error.message),
        }
      }
      personId = person.data.id
    } else {
      const existingPersonList = await rough.getPersonList({
        baseUrl: getRoughAppUrl(),
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
        query: {
          name: originalAuthor.name,
        },
      })
      if (existingPersonList.error) {
        return {
          success: false,
          reply: failure(
            'Could not getPersonList',
            existingPersonList.error.message,
          ),
        }
      }
      const existingPerson = existingPersonList.data.at(0)
      if (existingPerson) {
        personId = existingPerson.id
      } else {
        const person = await rough.createPerson({
          baseUrl: getRoughAppUrl(),
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
          body: {
            name: originalAuthor.name,
            email: originalAuthor.email,
          },
        })
        if (person.error) {
          return {
            success: false,
            reply: failure('Could not createPerson', person.error.message),
          }
        }
        personId = person.data.id
      }
    }
  }

  const note = await rough.createNote({
    baseUrl: getRoughAppUrl(),
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
    body: {
      content,
      createdByUserId: slackUser.roughUserId,
      referenceId,
      personId,
    },
  })
  if (note.error) {
    return {
      success: false,
      reply: failure('Could not createNote', note.error.message),
    }
  }

  return {
    success: true,
    reply: success(
      `${content} [📌](${getRoughAppUrl()}/workspace/${slackUser.roughWorkspacePublicId}/insight/active "View in Rough")`,
    ),
  }
}

export { createInsight }
