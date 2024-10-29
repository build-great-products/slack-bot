import { errorBoundary } from '@stayradiated/error-boundary'

import type { Reference } from '#src/rough/types.ts'

import { getRoughAppUrl } from '#src/env.ts'

type CreateReferenceOptions = {
  apiToken: string
  name: string
  url: string
}

const createReference = async (
  options: CreateReferenceOptions,
): Promise<Reference | Error> => {
  const { apiToken, name, url } = options

  return errorBoundary(async () => {
    const response = await fetch(
      new URL('/api/v1/reference', getRoughAppUrl()),
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name,
          url,
        }),
      },
    )
    if (!response.ok) {
      return new Error(
        `Failed to create reference: ${response.status} ${response.statusText}`,
      )
    }
    return response.json() as Promise<Reference>
  })
}

export { createReference }
