import { randomUUID } from 'node:crypto'

const genId = <T extends string = string>(): T => {
  return randomUUID() as T
}

export { genId }
