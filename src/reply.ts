type Reply = {
  text: string
  response_type?: 'in_channel' | 'ephemeral'
}

const text = (message: string): Reply => {
  return {
    text: message,
    response_type: 'ephemeral',
  }
}

const warning = (message: string) => text(`⚠️ ${message}`)

const failure = (message: string, error?: Error) =>
  text(`❌ ${message}${error ? ` Error: \`${error.message}\`` : ''}`)

const success = (message: string) => text(`✅ ${message}`)

const userNotIdentifiedReply = warning(
  'You are not yet identified. Please use the `/rough login` command to identify yourself.',
)

export { text, warning, failure, success, userNotIdentifiedReply }

export type { Reply }
