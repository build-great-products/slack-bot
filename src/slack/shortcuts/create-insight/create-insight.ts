import type { RoughOAuth2Provider } from '@roughapp/sdk'
import * as rough from '@roughapp/sdk'
import { errorBoundary } from '@stayradiated/error-boundary'

import type { KyselyDb, SlackUserId, SlackWorkspaceId } from '#src/database.ts'
import { getSlackUser } from '#src/db/slack-user/get-slack-user.ts'
import { getRoughAppUrl } from '#src/env.ts'

import { getOrRefreshAccessToken } from '#src/get-or-refresh-access-token.ts'

import {
  failure,
  type Reply,
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
    imageUrl?: string
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
      auth: apiToken,
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
    const existingPersonList = await rough.getPersonList({
      auth: apiToken,
      // if we have an email address, filter by email
      // otherwise filter by name
      query: originalAuthor.email
        ? { email: originalAuthor.email }
        : { name: originalAuthor.name },
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
      let imageUrl: string | undefined
      if (originalAuthor.imageUrl) {
        const image = await fetch(originalAuthor.imageUrl)

        // get the image data as a buffer
        const buffer = Buffer.from(await image.arrayBuffer())

        const mimeType = image.headers.get('content-type') ?? 'image/unknown'

        // upload to rough
        const asset = await rough.createPendingAsset({
          auth: apiToken,
          body: {
            originalFileName: `SlackImage:${originalAuthor.name}`,
            mimeType,
            metadata: {},
          },
        })
        if (asset.error || !asset.data) {
          console.error('Could not createPendingFileUpload', asset)
          // don't block the process if the image upload fails
          // continue without the image
        } else {
          const uploadResult = await errorBoundary(() =>
            rough.uploadFile({
              uploadToken: asset.data.tusUploadToken,
              data: buffer,
              mimeType,
            }),
          )
          if (uploadResult instanceof Error) {
            console.error(`Failed to upload image to Rough.`, uploadResult)
          } else {
            imageUrl = asset.data.url
          }
        }
      }

      const person = await rough.createPerson({
        auth: apiToken,
        body: {
          name: originalAuthor.name,
          email: originalAuthor.email,
          image: imageUrl,
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

  const note = await rough.createNote({
    auth: apiToken,
    body: {
      content,
      contentFormat: 'markdown',
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
