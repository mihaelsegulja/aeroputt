export function hash(n) {
  n = Math.imul(n ^ (n >>> 16), 2246822507)
  n = Math.imul(n ^ (n >>> 13), 3266489909)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296
}

const CHUNK = 800

export function createTerrain(seed) {
  const chunks = new Map()

  function noise(x, salt) {
    const i = Math.floor(x)
    const f = x - i
    const u = f * f * (3 - 2 * f)
    const a = hash(i * 2 + salt + seed) * 2 - 1
    const b = hash((i + 1) * 2 + salt + seed) * 2 - 1
    return a + (b - a) * u
  }

  function chunk(index) {
    let c = chunks.get(index)
    if (c) return c

    const d = Math.min(1, Math.max(0, index) / 38)
    let type = Math.floor(hash(index * 7 + seed) * 5)
    const width = 170 + hash(index * 7 + seed + 2) * 180
    let amp = 0
    let kind = 0

    if (type === 1) amp = 55 + d * 75
    else if (type === 2) amp = -(45 + d * 65)
    else if (type === 3) amp = 70 + d * 85
    else if (type === 4) {
      amp = 60 + d * 70
      kind = 1
    }

    const f = {
      x: (index + 0.5 + (hash(index * 7 + seed + 1) - 0.5) * 0.5) * CHUNK,
      w: type === 3 ? width * 0.55 : width,
      a: amp * (0.7 + hash(index * 7 + seed + 3) * 0.6),
      k: kind
    }

    let hazard = null
    if (hash(index * 13 + seed + 4) < 0.18 + d * 0.42) {
      hazard = {
        x: f.x + (hash(index * 13 + seed + 6) - 0.5) * 120,
        w: 80 + hash(index * 13 + seed + 5) * (80 + d * 60),
        t: hash(index * 13 + seed + 7) < 0.55 ? "sand" : "water"
      }
    }

    c = { f, hazard }
    chunks.set(index, c)
    return c
  }

  function feature(x, f) {
    const t = (x - f.x) / f.w
    if (t <= -1 || t >= 1) return 0
    const k = 1 - t * t
    if (!f.k) return f.a * k * k
    const u = Math.min(1, k * 1.7)
    return f.a * u * u
  }

  function offset(x) {
    const d = Math.min(1, Math.max(0, x) / 30000)
    const amp = 62 + d * 34

    let y =
      noise(x * 0.0022, 11) * amp +
      noise(x * 0.0071, 29) * amp * 0.42 +
      noise(x * 0.021, 47) * (8 + d * 8)

    const ci = Math.floor(x / CHUNK)

    for (let i = ci - 1; i <= ci + 1; i++) {
      y += feature(x, chunk(i).f)
    }

    return Math.tanh(y / 240) * 240
  }

  function surface(x) {
    const ci = Math.floor(x / CHUNK)
    let result = "grass"

    for (let i = ci - 1; i <= ci + 1; i++) {
      const h = chunk(i).hazard
      if (h && Math.abs(x - h.x) < h.w) {
        if (h.t === "water") return "water"
        result = "sand"
      }
    }

    return result
  }

  return { offset, surface }
}
