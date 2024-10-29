import { errorBoundary } from '@stayradiated/error-boundary'

import type { Note } from '#src/rough/types.ts'

import { getRoughAppUrl } from '#src/env.ts'

type CreateNoteOptions = {
  apiToken: string
  content: string
  createdByUserId: string
  referenceId?: string
  customerId?: string
}

const createNote = async (
  options: CreateNoteOptions,
): Promise<Note | Error> => {
  const { apiToken, content, createdByUserId, referenceId, customerId } =
    options

  return errorBoundary(async () => {
    const response = await fetch(new URL('/api/v1/note', getRoughAppUrl()), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        content,
        createdByUserId,
        referenceId,
        customerId,
      }),
    })
    if (!response.ok) {
      return new Error(
        `Failed to create note: ${response.status} ${response.statusText}`,
      )
    }
    return response.json() as Promise<Note>
  })
}

export { createNote }
