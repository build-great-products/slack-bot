import type { webApi } from '@slack/bolt'
import { errorBoundary } from '@stayradiated/error-boundary'

type LookupUserIdFn = (userId: string) => Promise<string | Error>

const createLookupUserIdFn = (client: webApi.WebClient): LookupUserIdFn => {
  return (userId: string) => {
    return errorBoundary(async () => {
      const user = await client.users.info({ user: userId })
      if (!user.ok) {
        return new Error('User not found')
      }

      const realName = user.user?.real_name
      if (realName && realName?.trim().length > 0) {
        return realName.trim()
      }

      const name = user.user?.name
      if (name && name.trim().length > 0) {
        return name.trim()
      }

      return 'Anonymous'
    })
  }
}

export { createLookupUserIdFn }
