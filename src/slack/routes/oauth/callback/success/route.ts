import { defineRoute } from '#src/utils/define-route.ts'
import { loadTemplate, renderTemplate } from '#src/utils/html-template.ts'

const getRoute = defineRoute(
  'GET',
  '/oauth/callback/success',
  async (_request, _context) => {
    const template = await loadTemplate(import.meta, './page.html')
    const html = renderTemplate({ template })

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  },
)

export { getRoute }
