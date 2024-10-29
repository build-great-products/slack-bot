import type { Template } from '#src/utils/html-template.js'

class HttpError extends Error {
  public readonly statusCode: number
  public readonly template: Template

  constructor(statusCode: number, message: string, template: Template) {
    super(message)
    this.statusCode = statusCode
    this.template = template
  }
}

const errorResponse = (statusCode: number, message: string) => {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}

export { HttpError, errorResponse }
