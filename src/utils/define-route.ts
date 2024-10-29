import type { App } from '@slack/bolt'
import { errorBoundary } from '@stayradiated/error-boundary'

import type { CustomRoute } from '@slack/bolt'
import type { KyselyDb } from '#src/database.ts'

import { buildErrorResponse } from '#src/utils/error-response.ts'

import type { RoughOAuth2Provider } from '#src/rough/oauth2.ts'

type ShortcutHandlerFn = Parameters<App['shortcut']>[2]
type ShortcutEvent = Parameters<ShortcutHandlerFn>[0]

type CommandHandlerFn = Parameters<App['command']>[2]
type CommandEvent = Parameters<CommandHandlerFn>[0]

type Method = 'GET' | 'POST'

type RouteContext = {
  db: KyselyDb
  roughOAuth: RoughOAuth2Provider
}

type Handler = (
  request: Request,
  context: RouteContext,
) => Promise<Response | Error>

const defineRoute = (method: Method, path: string, handler: Handler) => {
  return (context: RouteContext) => {
    const customRoute: CustomRoute = {
      path,
      method,
      handler: async (req, res) => {
        if (!req.url) {
          throw new Error('Request must have a URL')
        }
        const url = new URL(req.url, `http://${req.headers.host}`)
        const request = new Request(url, {
          headers: Object.entries(req.headers).flatMap(
            ([key, valueOrArray]) => {
              const value = Array.isArray(valueOrArray)
                ? valueOrArray.at(0)
                : valueOrArray
              if (typeof value !== 'string') {
                return []
              }
              return [[key, value]]
            },
          ),
        })
        const response = await errorBoundary(() => handler(request, context))
        if (response instanceof Error) {
          const errorResponse = await buildErrorResponse(request, response)
          res.writeHead(errorResponse.status)
          res.end(await errorResponse.text())
          return
        }

        for (const [key, value] of response.headers.entries()) {
          res.setHeader(key, value)
        }
        res.writeHead(response.status)
        res.end(await response.text())
      },
    }
    return customRoute
  }
}

export { defineRoute }
export type {
  RouteContext,
  CommandHandlerFn,
  CommandEvent,
  ShortcutHandlerFn,
  ShortcutEvent,
}
