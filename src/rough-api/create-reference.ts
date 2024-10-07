import { errorBoundary } from '@stayradiated/error-boundary'

import type { Reference } from './types.js'

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
    const response = await fetch('https://in.rough.app/api/v1/reference', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name,
        url,
      }),
    })
    if (!response.ok) {
      return new Error(
        `Failed to create reference: ${response.status} ${response.statusText}`,
      )
    }
    return response.json() as Promise<Reference>
  })
}

export { createReference }
