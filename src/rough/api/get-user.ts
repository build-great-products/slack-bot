import { errorBoundary } from '@stayradiated/error-boundary'

import type { User } from '#src/rough/types.ts'

import { getRoughAppUrl } from '#src/env.ts'

type GetUserOptions = {
  apiToken: string
  userId: string
}

const getUser = async (options: GetUserOptions): Promise<User | Error> => {
  const { apiToken, userId } = options

  return errorBoundary(async () => {
    const response = await fetch(
      new URL(`/api/v1/user/${userId}`, getRoughAppUrl()),
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      },
    )
    if (!response.ok) {
      return new Error(
        `Failed to get user: ${response.status} ${response.statusText}`,
      )
    }
    return response.json() as Promise<User>
  })
}

export { getUser }
