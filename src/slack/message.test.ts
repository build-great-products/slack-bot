import { test } from 'vitest'

import { getMessageText } from './message.js'

const lookupUserId = async (userId: string) => {
  if (userId === 'U123') return 'johndoe'
  if (userId === 'U456') return 'janedoe'
  return new Error('User not found')
}

test('should return text as is if no user mentions are found', async ({
  expect,
}) => {
  const messageText = 'Hello world'
  const result = await getMessageText({ messageText, lookupUserId })
  expect(result).toBe(messageText)
})

test('should replace user mentions with user names', async ({ expect }) => {
  const messageText = 'Hello <@U123> and <@U456>'
  const result = await getMessageText({ messageText, lookupUserId })
  expect(result).toBe('Hello @johndoe and @janedoe')
})

test('should ignore user mentions that cannot be resolved', async ({
  expect,
}) => {
  const messageText = 'Hello <@U123> and <@U789>'
  const result = await getMessageText({ messageText, lookupUserId })
  expect(result).toBe('Hello @johndoe and <@U789>')
})
