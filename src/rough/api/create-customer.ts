import { errorBoundary } from '@stayradiated/error-boundary'

import type { Customer } from '#src/rough/types.ts'

import { getRoughAppUrl } from '#src/env.ts'

type CreateCustomerOptions = {
  apiToken: string
  name: string
}

const createCustomer = async (
  options: CreateCustomerOptions,
): Promise<Customer | Error> => {
  const { apiToken, name } = options

  return errorBoundary(async () => {
    const response = await fetch(
      new URL('/api/v1/customer', getRoughAppUrl()),
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name,
        }),
      },
    )
    if (!response.ok) {
      return new Error(
        `Failed to create customer: ${response.status} ${response.statusText}`,
      )
    }
    return response.json() as Promise<Customer>
  })
}

export { createCustomer }
