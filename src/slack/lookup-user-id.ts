import type { webApi } from '@slack/bolt'
import { errorBoundary } from '@stayradiated/error-boundary'

type SlackUserProfile = {
  realName: string | undefined
  displayName: string | undefined
  email: string | undefined
  imageUrl: string | undefined
}

type LookupUserIdFn = (userId: string) => Promise<SlackUserProfile | Error>

const createLookupUserIdFn = (client: webApi.WebClient): LookupUserIdFn => {
  return (userId: string) => {
    return errorBoundary(async () => {
      const response = await client.users.info({ user: userId })
      const profile = response.user?.profile
      if (!response.ok || !profile) {
        return new Error('User not found')
      }

      const { real_name: realName, display_name: displayName, email } = profile
      const imageUrl =
        profile.image_original ??
        profile.image_1024 ??
        profile.image_512 ??
        profile.image_192 ??
        profile.image_72 ??
        profile.image_48 ??
        profile.image_32 ??
        profile.image_24

      return {
        realName,
        displayName,
        email,
        imageUrl,
      }
    })
  }
}

export { createLookupUserIdFn }
export type { LookupUserIdFn }
