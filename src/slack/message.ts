/*
 * replaces user mentions in the message with the user's name
 * i.e. <@U07R8566MHN> becomes @johndoe
 */

type ResolveMentionsOptions = {
  lookupUserId: (userId: string) => Promise<string | Error>
  messageText: string
}

const resolveMentions = async (
  options: ResolveMentionsOptions,
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

type MarkdownifyLinksOptions = {
  messageText: string
}

const markdownifyLinks = async (
  options: MarkdownifyLinksOptions,
): Promise<string> => {
  const { messageText } = options

  const regExp = /<([^<>|]*)(?:\|([^<>]*))?>/g

  const result = messageText.replace(regExp, (_match, url, label) =>
    label ? `[${label}](${url})` : `[${url}](${url})`,
  )

  return result
}

/*
 * - resolves user mentions in the message text
 * - markdownifies links in the message text
 *
 */

type GetMessageTextOptions = {
  lookupUserId: (userId: string) => Promise<string | Error>
  messageText: string
}

const getMessageText = async (
  options: GetMessageTextOptions,
): Promise<string> => {
  const { lookupUserId, messageText } = options
  return markdownifyLinks({
    messageText: await resolveMentions({ lookupUserId, messageText }),
  })
}

export { resolveMentions, markdownifyLinks, getMessageText }
