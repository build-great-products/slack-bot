const { makeKyselyHook, kyselyCamelCaseHook } = require('kanel-kysely')
const { generateIndexFile } = require('kanel')

/*
 * Generated Database.ts is not compatible with TS verbatimModuleSyntax
 * https://github.com/kristiandupont/kanel/issues/436
 */
const supportVerbatimModuleSyntaxHook = (filePath, lines) => {
  if (filePath.endsWith('Database.ts')) {
    lines.pop()
    lines.push('export type { Database as default };')
  }
  return lines
}

const kyselyHook = makeKyselyHook()

module.exports = {
  // When `kanel` is called directly, it will use the DATABASE_URL environment
  //
  // However, when `kanel` is called by `graphile-migrate`, it will override
  // the DATABASE_URL environment variable and force us to use GM_DBURL
  // instead.
  connection: process.env.GM_DBURL ?? process.env.DATABASE_URL,

  schemas: ['public'],

  enumStyle: 'enum',

  outputPath: 'src/__generated__/kanel',

  preDeleteOutputFolder: true,

  preRenderHooks: [kyselyHook, kyselyCamelCaseHook, generateIndexFile],
  postRenderHooks: [supportVerbatimModuleSyntaxHook],

  customTypeMap: {
    'pg_catalog.bytea': 'Uint8Array',
    'pg_catalog.int8': 'number',
    'pg_catalog.jsonb': 'Record<string, unknown>',
  },
}
