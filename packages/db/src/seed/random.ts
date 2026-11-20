// mulberry32: a tiny seeded generator. Same seed, same numbers, on any
// machine, which is all the seed needs. Not for anything secret.
export function createRandom(seed: number) {
  let state = seed >>> 0

  function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }

  function int(min: number, max: number) {
    return min + Math.floor(next() * (max - min + 1))
  }

  function pick<T>(items: readonly T[]): T {
    const item = items[int(0, items.length - 1)]
    if (item === undefined) throw new Error('Cannot pick from an empty list')
    return item
  }

  function weighted<T>(items: readonly { value: T; weight: number }[]): T {
    const total = items.reduce((sum, item) => sum + item.weight, 0)
    let roll = next() * total
    for (const item of items) {
      roll -= item.weight
      if (roll < 0) return item.value
    }
    return pick(items).value
  }

  function shuffle<T>(items: T[]): T[] {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i)
      const a = copy[i]
      const b = copy[j]
      if (a === undefined || b === undefined) throw new Error('Shuffle index out of range')
      copy[i] = b
      copy[j] = a
    }
    return copy
  }

  return { next, int, pick, weighted, shuffle }
}

export type Random = ReturnType<typeof createRandom>
