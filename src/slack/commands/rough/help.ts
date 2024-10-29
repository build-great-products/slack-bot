import type { CommandEvent, RouteContext } from '#src/utils/define-route.ts'

const handleHelp = async (event: CommandEvent, _context: RouteContext) => {
  const { respond } = event
  await respond({
    text: `Hi there! I'm Rough, your friendly neighborhood bot. Here are some things I can help you with:
      - \`/rough login\` to log in to Rough
      - \`/rough logout\` to log out of Rough
      - \`/rough help\` to see this message
`,
    response_type: 'ephemeral',
  })
}

export { handleHelp }
