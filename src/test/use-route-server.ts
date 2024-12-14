import type { IncomingMessage, ServerResponse } from 'node:http'
import type { CustomRoute } from '@slack/bolt'

import type { RoughOAuth2Provider } from '@roughapp/sdk'
import type { KyselyDb } from '#src/database.ts'
import type { RouteContext } from '#src/utils/define-route.ts'

type GetRouteFn = (context: RouteContext) => CustomRoute

type RouteServer = {
  fetch: (request: Request) => Promise<Response>
}

const useRouteServer =
  (getRouteList: GetRouteFn[]) =>
  async (
    { db, roughOAuth }: { db: KyselyDb; roughOAuth: RoughOAuth2Provider },
    use: (server: RouteServer) => Promise<void>,
  ): Promise<void> => {
    const routes = getRouteList
      .map((getRoute) => {
        return getRoute({ db, roughOAuth })
      })
      .reduce(
        (acc, route) => {
          acc[route.path] ??= {}

          const methodList = Array.isArray(route.method)
            ? route.method
            : [route.method]
          for (const method of methodList) {
            acc[route.path][method.toUpperCase()] = route.handler
          }

          return acc
        },
        {} as Record<string, Record<string, CustomRoute['handler']>>,
      )

    const server: RouteServer = {
      fetch: async (request) => {
        const url = new URL(request.url)
        const route = routes[url.pathname][request.method.toUpperCase()]
        if (!route) {
          return new Response(
            JSON.stringify({
              error: '404 not found',
            }),
            {
              status: 404,
            },
          )
        }

        const { promise, reject, resolve } = Promise.withResolvers<Response>()

        let status: number | undefined
        const headers: Record<string, string> = {}

        const mockReq = {
          url: request.url,
          headers: Object.fromEntries(
            request.headers,
          ) as IncomingMessage['headers'],
        } as unknown as IncomingMessage

        const mockRes = {
          setHeader: (key: string, value: string) => {
            headers[key] = value
          },
          writeHead: (statusCode: number) => {
            if (typeof status === 'number') {
              reject(new Error('Already wrote head!'))
            }
            status = statusCode
          },
          end: (body: string) => {
            const response = new Response(body, { status, headers })
            resolve(response)
          },
        } as unknown as ServerResponse<IncomingMessage>

        route(mockReq, mockRes)

        return promise
      },
    }
    await use(server)
  }

export { useRouteServer }
