import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// Function to escape special characters in user input
const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

type Template = {
  data: string
}

const loadTemplate = async (
  importMeta: ImportMeta,
  relativePath: string,
): Promise<Template> => {
  const dirname = path.dirname(fileURLToPath(importMeta.url))
  const filepath = path.join(dirname, relativePath)
  const data = await fs.readFile(filepath, 'utf8')
  return {
    data,
  }
}

type RenderTemplateOptions<Props> = {
  template: Template
  props?: Props
}

const renderTemplate = <Props extends Record<string, string>>(
  options: RenderTemplateOptions<Props>,
) => {
  const { template, props } = options

  let html = template.data

  // Replace each key in props with its escaped value
  if (props) {
    for (const key in props) {
      const escapedValue = escapeHtml(props[key])
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, escapedValue)
    }
  }

  return html
}

export { loadTemplate, renderTemplate }
export type { Template }
