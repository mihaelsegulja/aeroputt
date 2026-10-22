import "./style.css"

const canvas = document.getElementById("c")
const ctx = canvas.getContext("2d")

if (!canvas.getContext) {
  console.warn("Browser does not support canvas.")
}

const ball = {
  x: 100,
  y: 100,
  vx: 3,
  vy: 0,
  radius: 14,
  gravity: 0.25,
  bounce: -0.65
}

let isDragging = false
let dragStart = { x: 0, y: 0 }
let currentMouse = { x: 0, y: 0 }

const launchPower = 0.12

let cameraX = 0

resize()

window.addEventListener("resize", resize)
window.addEventListener("mousedown", (e) => {
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

loop()

function resize() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function loop() {
  updateBall()

  drawBackground()
  drawTerrain()
  drawBall()
  drawAimLine()

  let targetCameraX = ball.x - canvas.width * 0.3
  cameraX += (targetCameraX - cameraX) * 0.1

  requestAnimationFrame(loop)
}

function drawBackground() {
  let grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, "#74d7ff")
  grad.addColorStop(0.7, "#baf0ff")
  grad.addColorStop(1, "#ffffff")

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function getTerrainHeight(x) {
  const baseline = canvas.height * 0.65
  return baseline + Math.sin(x * 0.003) * 80 + Math.sin(x * 0.01) * 30
}

function drawTerrain() {
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
  terrainGrad.addColorStop(0, "#89e051")
  terrainGrad.addColorStop(0.4, "#2eb848")
  terrainGrad.addColorStop(1, "#125426")

  ctx.fillStyle = terrainGrad
  ctx.fill()
}

function drawBall() {
  ctx.save()
  ctx.translate(ball.x - cameraX, ball.y)

  let ballGrad = ctx.createRadialGradient(-4, -4, 1, 0, 0, ball.radius)
  ballGrad.addColorStop(0, "#ffffff")
  ballGrad.addColorStop(0.3, "#70e2ff")
  ballGrad.addColorStop(0.8, "#0066cc")
  ballGrad.addColorStop(1, "#002b66")

  ctx.beginPath()
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2)
  ctx.fillStyle = ballGrad
  ctx.fill()

  ctx.beginPath()
  ctx.ellipse(-3, -5, 5, 2.5, -Math.PI / 4, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
  ctx.fill()

  ctx.restore()
}

function updateBall() {
  if (isDragging) return

  ball.vy += ball.gravity
  ball.x += ball.vx
  ball.y += ball.vy

  let terrainY = getTerrainHeight(ball.x)

  if (ball.y + ball.radius >= terrainY) {
    ball.y = terrainY - ball.radius
    ball.vy *= ball.bounce
    ball.vx *= 0.96
  }

  // this only works if the ball is dragged to be shot very fast
  if (ball.x - ball.radius < cameraX) {
    ball.x = ball.radius + cameraX
    ball.vx = Math.max(0, -ball.vx * 0.3)
  }

  // if moving slightly, stop
  if (Math.abs(ball.vx) < 0.05 && Math.abs(ball.vy) < 0.05) {
    ball.vx = 0
    ball.vy = 0
  }
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

  let simX = ball.x
  let simY = ball.y
  let simVx = dx * launchPower
  let simVy = dy * launchPower

  for (let i = 0; i < 14; i++) {
    simVy += ball.gravity
    simX += simVx
    simY += simVy

    const simScreenX = simX - cameraX

    const dotRadius = 4.5
    let dotGrad = ctx.createRadialGradient(
      simScreenX - 1, simY - 1, 0.5,
      simScreenX, simY, dotRadius
    )
    dotGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)")
    dotGrad.addColorStop(0.5, "rgba(200, 245, 255, 0.6)")
    dotGrad.addColorStop(1, "rgba(255, 255, 255, 0.15)")

    ctx.shadowColor = "rgba(116, 215, 255, 0.8)"
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.arc(simScreenX, simY, dotRadius, 0, Math.PI * 2)
    ctx.fillStyle = dotGrad
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(simScreenX - 1.2, simY - 1.2, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
    ctx.fill()
  }

  ctx.restore()
}