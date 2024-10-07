type Reply = {
  content: string
  response_type?: 'in_channel' | 'ephemeral'
}

const warning = (message: string): Reply => {
  return {
    content: `⚠️ ${message}`,
    response_type: 'ephemeral',
  }
}

const failure = (message: string, error?: Error): Reply => {
  return {
    content: `❌ ${message}${error ? ` Error: \`${error.message}\`` : ''}`,
    response_type: 'ephemeral',
  }
}

const slackWorkspaceNotConnectedReply = warning(
  'This slackWorkspace is not yet connected to Rough. Please use the `/rough-connect` command to connect it.',
)

const userNotIdentifiedReply = warning(
  'You are not yet identified. Please use the `/rough-identify` command to identify yourself.',
)

export {
  warning,
  failure,
  slackWorkspaceNotConnectedReply,
  userNotIdentifiedReply,
}

export type { Reply }
