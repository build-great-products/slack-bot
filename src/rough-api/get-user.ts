import { errorBoundary } from '@stayradiated/error-boundary'

import type { User } from './types.js'

type GetUserOptions = {
  apiToken: string
  userId: string
}

const getUser = async (options: GetUserOptions): Promise<User | Error> => {
  const { apiToken, userId } = options

  return errorBoundary(async () => {
    const response = await fetch(`https://in.rough.app/api/v1/user/${userId}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${apiToken}`,
      },
    })
    if (!response.ok) {
      return new Error(
        `Failed to get user: ${response.status} ${response.statusText}`,
      )
    }
    return response.json() as Promise<User>
  })
}

export { getUser }
