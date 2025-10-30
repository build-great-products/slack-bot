import type { IncomingMessage, ServerResponse } from 'node:http'
import type { RoughOAuth2Provider } from '@roughapp/sdk'
import type { CustomRoute } from '@slack/bolt'
import { createFactory } from 'test-fixture-factory'
import type { KyselyDb } from '#src/database.ts'
import type { RouteContext } from '#src/utils/define-route.ts'

type RouteServer = {
  fetch: (request: Request) => Promise<Response>
}
type GetRouteFn = (context: RouteContext) => CustomRoute

const routeServerFactory = createFactory<RouteServer>('RouteServer')
  .withContext<{
    db: KyselyDb
    roughOAuth: RoughOAuth2Provider
  }>()
  .withSchema((f) => ({
    db: f.type<KyselyDb>().from('db'),
    roughOAuth: f.type<RoughOAuth2Provider>().from('roughOAuth'),
    routes: f.type<GetRouteFn[]>(),
  }))
  .fixture(async (attrs, use) => {
    const { db, roughOAuth, routes: initialRoutes } = attrs

    const routes = initialRoutes
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
  })

const useRouteServer = routeServerFactory.useValue

export { useRouteServer }
