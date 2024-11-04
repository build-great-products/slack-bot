import { describe, test } from 'vitest'

import { getMessageText, markdownifyLinks, resolveMentions } from './message.js'

const lookupUserId = async (userId: string) => {
  if (userId === 'U123') return 'johndoe'
  if (userId === 'U456') return 'janedoe'
  return new Error('User not found')
}

describe('resolveMentions', () => {
  test('should return text as is if no user mentions are found', async ({
    expect,
  }) => {
    const messageText = 'Hello world'
    const result = await resolveMentions({ messageText, lookupUserId })
    expect(result).toBe(messageText)
  })

  test('should replace user mentions with user names', async ({ expect }) => {
    const messageText = 'Hello <@U123> and <@U456>'
    const result = await resolveMentions({ messageText, lookupUserId })
    expect(result).toBe('Hello @johndoe and @janedoe')
  })

  test('should ignore user mentions that cannot be resolved', async ({
    expect,
  }) => {
    const messageText = 'Hello <@U123> and <@U789>'
    const result = await resolveMentions({ messageText, lookupUserId })
    expect(result).toBe('Hello @johndoe and <@U789>')
  })
})

describe('markdownifyLinks', () => {
  test('should return text as is if no links are found', async ({ expect }) => {
    const messageText = 'Hello world'
    const result = await markdownifyLinks({ messageText })
    expect(result).toBe(messageText)
  })

  test('should replace links with markdown format', async ({ expect }) => {
    const messageText = 'Hello <https://example.com|example>'
    const result = await markdownifyLinks({ messageText })
    expect(result).toBe('Hello [example](https://example.com)')
  })

  test('should replace links with only a url', async ({ expect }) => {
    const messageText = 'Hello <https://example.com>'
    const result = await markdownifyLinks({ messageText })
    expect(result).toBe('Hello [https://example.com](https://example.com)')
  })
})

describe('getMessageText', () => {
  test('should resolve user mentions and markdownify links', async ({
    expect,
  }) => {
    const messageText = 'Hello <@U123> and <https://example.com|example>'
    const result = await getMessageText({ messageText, lookupUserId })
    expect(result).toBe('Hello @johndoe and [example](https://example.com)')
  })
})
