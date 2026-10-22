import { hash } from "./terrain.js"

const FIRST_TEE = 100
const TEE_GAP = 300
const MIN_LENGTH = 1400
const MAX_LENGTH = 2600
const LENGTH_GROWTH = 110

export function parFor(length) {
  if (length < 1600) return 2
  if (length < 2400) return 3
  return 4
}

export function createCourse(seed, terrain) {
  const holes = new Map()

  function isGrass(x, margin) {
    return (
      terrain.surface(x - margin) === "grass" &&
      terrain.surface(x) === "grass" &&
      terrain.surface(x + margin) === "grass"
    )
  }

  function slopeAt(x) {
    let slope = 0
    for (const o of [-30, 0, 30]) {
      slope = Math.max(
        slope,
        Math.abs(terrain.offset(x + o + 20) - terrain.offset(x + o - 20)) / 40
      )
    }
    return slope
  }

  function findTee(x, forward = false) {
    let best = x
    let bestCost = Infinity

    for (const range of [300, 700, 1200]) {
      for (let d = forward ? 0 : -range; d <= range; d += 20) {
        const p = x + d
        if (!isGrass(p, 10)) continue

        const cost = slopeAt(p) * 8 + Math.abs(d) * 0.01
        if (cost < bestCost) {
          bestCost = cost
          best = p
        }
      }

      if (bestCost < Infinity) return best
    }

    return best
  }

  function findCup(tee, target, n) {
    let best = target
    let bestCost = Infinity

    for (const scan of [350, 700, 1200]) {
      for (let i = -scan; i <= scan; i += 12) {
        const x = target + i
        if (x < tee + 900) continue
        if (!isGrass(x, 70)) continue

        const cost =
          slopeAt(x) * 30 +
          (Math.abs(i) / scan) * 2.2 +
          hash(seed + n * 7919 + Math.floor(x)) * 0.05

        if (cost < bestCost) {
          bestCost = cost
          best = x
        }
      }

      if (bestCost < Infinity) return best
    }

    return best
  }

  function hole(n) {
    const cached = holes.get(n)
    if (cached) return cached

    const prev = n === 0 ? null : hole(n - 1)
    const tee = n === 0 ? findTee(FIRST_TEE, true) : findTee(prev.cup + TEE_GAP)
    const length = MIN_LENGTH + Math.min(1200, n * LENGTH_GROWTH)
    const cup = findCup(tee, tee + length, n)

    const result = {
      n,
      tee,
      cup,
      length: cup - tee,
      par: parFor(cup - tee)
    }

    holes.set(n, result)
    return result
  }

  return { hole }
}
