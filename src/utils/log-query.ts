import type { Compilable } from 'kysely'

/*
useful for debugging queries

usage:
  wrap logQuery around a call to db
  but before you call .execute*()

example:

  const result = db
    .selectFrom('blockProblem')
    .selectAll('')
    .executeTakeFirstOrThrow()

becomes:

  const result = logQuery(
    db
      .selectFrom('blockProblem')
      .selectAll('')
  ).executeTakeFirstOrThrow()

*/

const logQuery = <T extends Compilable>(db: T): T => {
  const query = db.compile()
  console.log(query.sql)

  // KyselyDb gives an array of parameters e.g. [a, b, c]
  // and the SQL query uses $1, $2, $3
  // To make it easier to debug, we can print each parameter next to the
  // corresponding $id key
  console.log(
    Object.fromEntries(
      query.parameters.map((value, index) => [`$${index + 1}`, value]),
    ),
  )
  return db
}

const logQueryBlended = <T extends Compilable>(db: T): T => {
  const query = db.compile()

  const entries = Object.fromEntries(
    query.parameters.map((value, index) => [`$${index + 1}`, value]),
  )
  const blendedQuery = query.sql.replace(/\$[0-9]+/g, (match) => {
    return `'${entries[match]}'`
  })
  console.log(blendedQuery)

  return db
}

export { logQuery, logQueryBlended }
