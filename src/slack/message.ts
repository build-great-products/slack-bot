/*
 * replaces user mentions in the message with the user's name
 * i.e. <@U07R8566MHN> becomes @johndoe
 */

type GetMessageTextOptions = {
  lookupUserId: (userId: string) => Promise<string | Error>
  messageText: string
}

const getMessageText = async (
  options: GetMessageTextOptions,
): Promise<string> => {
  const { lookupUserId, messageText } = options

  const regExp = /<@(\w+)>/g
  const userMentions = Array.from(messageText.matchAll(regExp))

  // Step 1: Look up all user IDs asynchronously and store results in a Map
  const userMap = new Map<string, string>()
  for (const [, userId] of userMentions) {
    const userName = await lookupUserId(userId)
    if (userName instanceof Error) {
      continue
    }
    userMap.set(userId, `@${userName}`)
  }

  // Step 2: Replace all mentions with names using the Map
  const result = messageText.replace(
    regExp,
    (match, userId) => userMap.get(userId) ?? match,
  )

  return result
}

export { getMessageText }
