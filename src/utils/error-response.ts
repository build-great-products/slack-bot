import { HttpError, errorResponse } from '#src/utils/error.ts'
import { type Template, renderTemplate } from '#src/utils/html-template.ts'

const errorPageResponse = async (
  statusCode: number,
  template: Template,
  message: string,
) => {
  const html = renderTemplate({ template, props: { message } })

  return new Response(html, {
    status: statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

const buildErrorResponse = async (
  request: Request,
  error: Error,
): Promise<Response> => {
  if (error instanceof HttpError) {
    const accept = request.headers.get('Accept')
    if (accept?.includes('text/html')) {
      return errorPageResponse(error.statusCode, error.template, error.message)
    }
    return errorResponse(error.statusCode, error.message)
  }

  return errorResponse(500, error.message)
}

export { buildErrorResponse }
