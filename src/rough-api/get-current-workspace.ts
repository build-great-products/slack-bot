import { errorBoundary } from '@stayradiated/error-boundary'

import type { Workspace } from './types.js'

type GetCurrentWorkspaceOptions = {
  apiToken: string
}

const getCurrentWorkspace = async (
  options: GetCurrentWorkspaceOptions,
): Promise<Workspace | Error> => {
  const { apiToken } = options

  return errorBoundary(async () => {
    const response = await fetch(
      'https://in.rough.app/api/v1/workspace/current',
      {
        method: 'GET',
        headers: {
          authorization: `Bearer ${apiToken}`,
        },
      },
    )
    if (!response.ok) {
      return new Error(
        `Failed to get current workspace: ${response.status} ${response.statusText}`,
      )
    }
    return response.json() as Promise<Workspace>
  })
}

export { getCurrentWorkspace }
