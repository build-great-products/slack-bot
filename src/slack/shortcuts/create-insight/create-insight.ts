import { inspect } from 'node:util'
import type { RoughOAuth2Provider } from '@roughapp/sdk'
import * as rough from '@roughapp/sdk'
import { collect, parallelMap } from 'streaming-iterables'

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
  fileList?: File[]
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
    fileList,
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
        const imageResponse = await fetch(originalAuthor.imageUrl)
        const imageBlob = await imageResponse.blob()
        const imageFile = new File([imageBlob], originalAuthor.name)

        // upload to rough
        const asset = await rough.createAsset({
          auth: apiToken,
          body: {
            file: imageFile,
          },
        })
        if (asset.error) {
          console.error(`Failed to upload image to Rough.`, asset.error)
        } else {
          imageUrl = asset.data.url
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

  let contentWithFiles = content

  if (fileList) {
    const assetList = await collect(
      parallelMap(
        4,
        async (file) => {
          console.info(
            `Uploading new asset "${file.name}" (${file.type}, ${file.size} bytes) to Rough.`,
          )

          const asset = await rough.createAsset({
            auth: apiToken,
            body: {
              file,
            },
            headers: {
              Origin: 'https://in.rough.app',
            },
          })
          if (asset.error) {
            return new Error(asset.error.message)
          }
          return asset.data
        },
        fileList,
      ),
    )

    for (const asset of assetList) {
      if (asset instanceof Error) {
        console.error(asset)
        continue
      }
      if (asset.type === 'IMAGE') {
        contentWithFiles += `\n![${asset.originalFileName}](${asset.url} "assetId=${asset.id},width=${asset.metadata.width},height=${asset.metadata.height}")`
      } else {
        contentWithFiles += `\n[${asset.originalFileName}](${asset.url} "assetId=${asset.id}")`
      }
    }
  }

  console.info(
    `Creating markdown note: ${inspect({ createdByUserId: slackUser.roughUserId, referenceId, personId, content: contentWithFiles })}`,
  )

  const note = await rough.createNote({
    auth: apiToken,
    body: {
      content: contentWithFiles,
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
