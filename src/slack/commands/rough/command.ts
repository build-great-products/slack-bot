import type { CommandHandlerFn, RouteContext } from '#src/utils/define-route.ts'

import { handleHelp } from './help.ts'
import { handleLogin } from './login.ts'
import { handleLogout } from './logout.ts'

const getCommand =
  (context: RouteContext): CommandHandlerFn =>
  async (event) => {
    const { command, ack } = event

    // Acknowledge the shortcut
    await ack()

    const subcommand = command.text.trim()
    switch (subcommand) {
      case 'login': {
        return handleLogin(event, context)
      }
      case 'logout': {
        return handleLogout(event, context)
      }
      default: {
        return handleHelp(event, context)
      }
    }
  }

export { getCommand }
