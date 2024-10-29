type IsEqualFn<Key> = (a: Key, b: Key) => boolean

class PirateSet<Key> extends Set {
  #isEqual: IsEqualFn<Key>

  constructor(isEqual: IsEqualFn<Key>) {
    super()
    this.#isEqual = isEqual
  }

  delete(key: Key): boolean {
    for (const _key of super.keys()) {
      if (this.#isEqual(key, _key)) {
        return super.delete(_key)
      }
    }

    return false
  }

  has(key: Key): boolean {
    for (const _key of super.keys()) {
      if (this.#isEqual(key, _key)) {
        return true
      }
    }

    return false
  }

  add(key: Key): this {
    for (const _key of super.keys()) {
      if (this.#isEqual(key, _key)) {
        // If the key is already in the set, return the set unchanged.
        return this
      }
    }
    return super.add(key)
  }
}

export { PirateSet }
