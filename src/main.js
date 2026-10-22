import "./style.css"
import { createSettings } from "./settings"
import { createTerrain, hash } from "./terrain"

const canvas = document.getElementById("c")
const ctx = canvas.getContext("2d")

const seed = Math.floor(Math.random() * 4294967296)
const terrain = createTerrain(seed)

const ball = {
  x: 100,
  y: 100,
  vx: 3,
  vy: 0,
  radius: 14,
  gravity: 0.25
}

const SURFACES = {
  grass: { friction: 0.96, bounce: 0.65 },
  sand: { friction: 0.78, bounce: 0.08 },
  water: { friction: 0.88, bounce: 0.35 }
}

const PX_PER_M = 20
const startX = ball.x

const distanceEl = document.createElement("div")
distanceEl.className = "aero-distance"

const distanceLabel = document.createElement("span")
distanceLabel.textContent = "Distance"

const distanceValue = document.createElement("b")
distanceValue.textContent = "0 m"

distanceEl.append(distanceLabel, distanceValue)
document.body.append(distanceEl)

let isDragging = false
let dragStart = { x: 0, y: 0 }
let currentMouse = { x: 0, y: 0 }

const launchPower = 0.12

let cameraX = 0

let lastTime
let isPaused = false
let menuOpen = false

const TAU = Math.PI * 2
const CLOUD_TILE = 300
const FIXED_STEP = 1 / 60
const MAX_FRAME_TIME = 0.25
let accumulator = 0

/* Core */

resize()

window.addEventListener("resize", resize)
window.addEventListener("mousedown", (e) => {
  if (menuOpen || e.target !== canvas) return
  const speed = Math.hypot(ball.vx, ball.vy)
  if (speed < 0.5) {
    const ballScreenX = ball.x - cameraX
    const dist = Math.hypot(e.clientX - ballScreenX, e.clientY - ball.y)
    if (dist < 60) {
      isDragging = true
      dragStart = { x: e.clientX, y: e.clientY }
      currentMouse = { x: e.clientX, y: e.clientY }
      
      ball.vx = 0
      ball.vy = 0
    }
  }
})

window.addEventListener("blur", () => {
  isPaused = true
})

window.addEventListener("focus", () => {
  isPaused = false
  lastTime = performance.now()
  accumulator = 0
})

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    isPaused = true
  } else {
    isPaused = false
    lastTime = performance.now()
    accumulator = 0
  }
})

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    currentMouse = { x: e.clientX, y: e.clientY }
  }
})

window.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false
    
    const dx = dragStart.x - currentMouse.x
    const dy = dragStart.y - currentMouse.y
    
    ball.vx = dx * launchPower
    ball.vy = dy * launchPower
  }
})

createSettings((open) => {
  menuOpen = open
  isDragging = false
  accumulator = 0
  if (!open) lastTime = performance.now()
}, seed)

requestAnimationFrame(loop)

/* functions */

function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function loop(currentTime) {
  if (lastTime === undefined) lastTime = currentTime

  let frameTime = (currentTime - lastTime) / 1000
  lastTime = currentTime
  frameTime = Math.min(frameTime, MAX_FRAME_TIME)

  if (!isPaused && !menuOpen) {
    accumulator += frameTime

    while (accumulator >= FIXED_STEP) {
      updateBall()
      updateCamera()
      accumulator -= FIXED_STEP
    }
  } else {
    accumulator = 0
  }

  distanceValue.textContent = `${Math.round((ball.x - startX) / PX_PER_M)} m`

  drawBackground()
  drawTerrain(currentTime)
  drawBall()
  drawAimLine()

  requestAnimationFrame(loop)
}

function updateCamera() {
  let targetCameraX = ball.x - canvas.width * 0.3
  cameraX += (targetCameraX - cameraX) * 0.1
}

function drawBackground() {
  let grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, "#2f9fe0")
  grad.addColorStop(0.35, "#82d9ff")
  grad.addColorStop(0.7, "#c8f2ff")
  grad.addColorStop(1, "#ffffff")

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let sunX = canvas.width * 0.8
  let sunY = canvas.height * 0.1
  let sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, canvas.height * 0.6)
  sun.addColorStop(0, "rgba(255,255,255,0.9)")
  sun.addColorStop(0.08, "rgba(235,252,255,0.55)")
  sun.addColorStop(0.35, "rgba(160,230,255,0.16)")
  sun.addColorStop(1, "rgba(160,230,255,0)")

  ctx.fillStyle = sun
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const parallax = cameraX * 0.12
  const first = Math.floor(parallax / CLOUD_TILE) - 1
  const last = Math.ceil((parallax + canvas.width) / CLOUD_TILE) + 1

  for (let i = first; i <= last; i++) {
    for (let k = 0; k < Math.round(hash(i + seed) * 4); k++) {
      const s = i * 32 + k * 4 + seed
      drawCloud(
        i * CLOUD_TILE - parallax + hash(s + 1) * CLOUD_TILE,
        canvas.height * (0.04 + hash(s + 2) * 0.38),
        0.35 + hash(s + 3) * 1,
        hash(s + 4)
      )
    }
  }
}

function drawCloud(x, y, scale, v) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale * (0.85 + v * 0.45), scale * (0.8 + v * 0.4))

  let cloud = ctx.createRadialGradient(0, 0, 4, 0, 0, 70)
  cloud.addColorStop(0, "rgba(255,255,255,0.85)")
  cloud.addColorStop(0.55, "rgba(255,255,255,0.4)")
  cloud.addColorStop(1, "rgba(255,255,255,0)")

  ctx.fillStyle = cloud
  ctx.beginPath()
  ctx.arc(-34, 6, 40, 0, TAU)
  ctx.arc(0, -8, 52, 0, TAU)
  ctx.fill()
  ctx.restore()
}

function getTerrainHeight(x) {
  return canvas.height * 0.65 + terrain.offset(x)
}

function getSurface(x) {
  return terrain.surface(x)
}

function drawTerrain(time) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(0, canvas.height)

  for (let screenX = 0; screenX <= canvas.width; screenX += 5) {
    let worldX = screenX + cameraX
    let y = getTerrainHeight(worldX)
    ctx.lineTo(screenX, y)
  }

  ctx.lineTo(canvas.width, canvas.height)
  ctx.closePath()

  let terrainGrad = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height)
  terrainGrad.addColorStop(0, "#c8ff8a")
  terrainGrad.addColorStop(0.18, "#63e06f")
  terrainGrad.addColorStop(0.55, "#1eb74a")
  terrainGrad.addColorStop(1, "#0a4424")

  ctx.fillStyle = terrainGrad
  ctx.fill()

  ctx.clip()

  let sheen = ctx.createLinearGradient(0, canvas.height * 0.52, 0, canvas.height * 0.82)
  sheen.addColorStop(0, "rgba(255,255,255,0.34)")
  sheen.addColorStop(1, "rgba(255,255,255,0)")

  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const stripeWidth = 40

  const offset = cameraX % (stripeWidth * 2)

  ctx.fillStyle = "rgba(0, 0, 0, 0.06)"

  for (let x = -stripeWidth * 4 - offset; x < canvas.width + stripeWidth * 4; x += stripeWidth * 2) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + stripeWidth, 0)
    ctx.lineTo(x + stripeWidth - 300, canvas.height + 300)
    ctx.lineTo(x - 300, canvas.height + 300)
    ctx.closePath()
    ctx.fill()
  }

  ctx.restore()

  ctx.save()
  ctx.beginPath()

  for (let screenX = 0; screenX <= canvas.width; screenX += 5) {
    let worldX = screenX + cameraX
    let y = getTerrainHeight(worldX)
    if (screenX === 0) {
      ctx.moveTo(screenX, y)
    } else {
      ctx.lineTo(screenX, y)
    }
  }

  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  ctx.strokeStyle = "rgba(226,255,196,0.85)"
  ctx.lineWidth = 7
  ctx.stroke()

  ctx.strokeStyle = "#1f8f3c"
  ctx.lineWidth = 2.5
  ctx.stroke()

  ctx.restore()

  drawSurfaces(time)
}

function drawSurfaces(time) {
  const step = 6
  let start = cameraX
  let type = getSurface(start)

  for (let sx = step; sx <= canvas.width; sx += step) {
    const wx = sx + cameraX
    const t = getSurface(wx)

    if (t !== type) {
      if (type !== "grass") drawSurfaceSpan(start, wx, type, time)
      start = wx
      type = t
    }
  }

  if (type !== "grass") drawSurfaceSpan(start, cameraX + canvas.width, type, time)
}

function drawSurfaceSpan(x0, x1, type, time) {
  const water = type === "water"
  const depth = water ? 20 : 22
  const top = water ? 1 : 2
  const left = x0 - cameraX
  const right = x1 - cameraX
  const span = x1 - x0

  const thickness = (x) => depth * (0.16 + 0.84 * Math.min(1, Math.sin(((x - x0) / span) * Math.PI) * 2.2))

  const grad = ctx.createLinearGradient(0, canvas.height * 0.45, 0, canvas.height)

  if (water) {
    grad.addColorStop(0, "rgba(205,250,255,0.92)")
    grad.addColorStop(0.45, "rgba(70,195,245,0.72)")
    grad.addColorStop(1, "rgba(8,110,185,0.55)")
  } else {
    grad.addColorStop(0, "#ffe8a8")
    grad.addColorStop(0.5, "#eab85f")
    grad.addColorStop(1, "#b9772a")
  }

  ctx.beginPath()
  ctx.moveTo(left, getTerrainHeight(x0) + top)

  for (let x = x0 + 6; x < x1; x += 6) {
    ctx.lineTo(x - cameraX, getTerrainHeight(x) + top)
  }

  ctx.lineTo(right, getTerrainHeight(x1) + top)

  for (let x = x1; x > x0; x -= 6) {
    ctx.lineTo(x - cameraX, getTerrainHeight(x) + thickness(x))
  }

  ctx.lineTo(left, getTerrainHeight(x0) + thickness(x0))
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(left, getTerrainHeight(x0) + top)

  for (let x = x0 + 6; x < x1; x += 6) {
    ctx.lineTo(x - cameraX, getTerrainHeight(x) + top)
  }

  ctx.lineTo(right, getTerrainHeight(x1) + top)
  ctx.strokeStyle = water ? "rgba(255,255,255,0.9)" : "rgba(110,65,20,0.4)"
  ctx.lineWidth = water ? 2 : 1
  ctx.stroke()

  if (!water) return

  ctx.strokeStyle = "rgba(255,255,255,0.65)"
  ctx.lineWidth = 1.4

  for (let x = x0 + 12; x < x1; x += 28) {
    const y = getTerrainHeight(x) + 6 + Math.sin(x * 0.05 + time * 0.004) * 1.5
    ctx.beginPath()
    ctx.moveTo(x - cameraX - 5, y)
    ctx.lineTo(x - cameraX + 5, y)
    ctx.stroke()
  }
}

function drawBall() {
  const screenX = ball.x - cameraX
  const terrainY = getTerrainHeight(ball.x)
  const gap = Math.max(0, terrainY - (ball.y + ball.radius))
  const shrink = Math.max(0.35, 1 - gap / 260)

  ctx.save()
  ctx.beginPath()
  ctx.ellipse(screenX, terrainY + 3, ball.radius * 1.25 * shrink, ball.radius * 0.4 * shrink, 0, 0, TAU)
  ctx.fillStyle = "rgba(4,60,32,0.22)"
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(screenX, ball.y)

  ctx.shadowColor = "rgba(110,225,255,0.85)"
  ctx.shadowBlur = 16

  let ballGrad = ctx.createRadialGradient(-5, -6, 1, 0, 0, ball.radius)
  ballGrad.addColorStop(0, "#ffffff")
  ballGrad.addColorStop(0.22, "#bdf4ff")
  ballGrad.addColorStop(0.55, "#35b9ee")
  ballGrad.addColorStop(0.85, "#0664c9")
  ballGrad.addColorStop(1, "#022a66")

  ctx.beginPath()
  ctx.arc(0, 0, ball.radius, 0, TAU)
  ctx.fillStyle = ballGrad
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.lineWidth = 1.5
  ctx.strokeStyle = "rgba(255,255,255,0.5)"
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(-4, -5, 5.5, 3, -Math.PI / 4, 0, TAU)
  ctx.fillStyle = "rgba(255,255,255,0.9)"
  ctx.fill()

  ctx.beginPath()
  ctx.arc(4, -6, 1.6, 0, TAU)
  ctx.fillStyle = "rgba(255,255,255,0.8)"
  ctx.fill()

  ctx.restore()
}

function stepBall(b) {
  b.vy += ball.gravity
  b.x += b.vx
  b.y += b.vy

  const terrainY = getTerrainHeight(b.x)

  if (b.y + b.radius >= terrainY) {
    const e = Math.max(2, b.radius)
    const slope = (getTerrainHeight(b.x + e) - getTerrainHeight(b.x - e)) / (e * 2)
    const len = Math.hypot(slope, 1)
    const nx = slope / len
    const ny = -1 / len
    const s = SURFACES[getSurface(b.x)]

    b.y = terrainY - b.radius / len

    const vn = b.vx * nx + b.vy * ny
    const tx = -ny
    const ty = nx
    const vt = b.vx * tx + b.vy * ty

    if (vn < -0.35) {
      const bounce = -vn * s.bounce
      b.vx = tx * vt * s.friction + nx * bounce
      b.vy = ty * vt * s.friction + ny * bounce
    } else {
      b.vx = tx * vt * s.friction
      b.vy = ty * vt * s.friction
    }
  }

  // this only works if the ball is dragged to be shot very fast
  if (b.x - b.radius < cameraX) {
    b.x = b.radius + cameraX
    b.vx = Math.max(0, -b.vx * 0.3)
  }

  // if moving slightly, stop
  if (Math.abs(b.vx) < 0.05 && Math.abs(b.vy) < 0.05) {
    b.vx = 0
    b.vy = 0
  }
}

function updateBall() {
  if (isDragging) return
  stepBall(ball)
}

function drawAimLine() {
  if (!isDragging) return

  const dx = dragStart.x - currentMouse.x
  const dy = dragStart.y - currentMouse.y

  const ballScreenX = ball.x - cameraX

  ctx.save()

  ctx.shadowColor = "rgba(255, 255, 255, 0.9)"
  ctx.shadowBlur = 12

  ctx.beginPath()
  ctx.moveTo(ballScreenX, ball.y)
  ctx.lineTo(currentMouse.x, currentMouse.y)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)"
  ctx.lineWidth = 6
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(ballScreenX, ball.y)
  ctx.lineTo(currentMouse.x, currentMouse.y)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)"
  ctx.lineWidth = 2
  ctx.setLineDash([6, 6])
  ctx.stroke()
  ctx.setLineDash([])

  const sim = { x: ball.x, y: ball.y, vx: dx * launchPower, vy: dy * launchPower, radius: ball.radius }

  for (let i = 0; i < 14; i++) {
    stepBall(sim)

    const simScreenX = sim.x - cameraX

    const dotRadius = 4.5
    let dotGrad = ctx.createRadialGradient(
      simScreenX - 1, sim.y - 1, 0.5,
      simScreenX, sim.y, dotRadius
    )
    dotGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)")
    dotGrad.addColorStop(0.5, "rgba(200, 245, 255, 0.6)")
    dotGrad.addColorStop(1, "rgba(255, 255, 255, 0.15)")

    ctx.shadowColor = "rgba(116, 215, 255, 0.8)"
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.arc(simScreenX, sim.y, dotRadius, 0, TAU)
    ctx.fillStyle = dotGrad
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(simScreenX - 1.2, sim.y - 1.2, 1.2, 0, TAU)
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
    ctx.fill()
  }

  ctx.restore()
}
