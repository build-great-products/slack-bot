import { errorBoundary } from '@stayradiated/error-boundary'

import type { User } from './types.js'

type GetUserListOptions = {
  apiToken: string
}

const getUserList = async (
  options: GetUserListOptions,
): Promise<User[] | Error> => {
  const { apiToken } = options

  return errorBoundary(async () => {
    const response = await fetch('https://in.rough.app/api/v1/user', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${apiToken}`,
      },
    })
    if (!response.ok) {
      return new Error(
        `Failed to get user list: ${response.status} ${response.statusText}`,
      )
    }
    return response.json() as Promise<User[]>
  })
}

export { getUserList }
