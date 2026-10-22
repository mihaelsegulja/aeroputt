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

resize()

window.addEventListener("resize", resize)

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

  for (let x = 0; x <= canvas.width; x += 5) {
    let y = getTerrainHeight(x)
    ctx.lineTo(x, y)
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
  ctx.translate(ball.x, ball.y)

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
  ball.vy += ball.gravity
  ball.x += ball.vx
  ball.y += ball.vy

  let terrainY = getTerrainHeight(ball.x)

  if (ball.y + ball.radius >= terrainY) {
    ball.y = terrainY - ball.radius
    ball.vy *= ball.bounce
    ball.vx *= 0.99
  }

  if (ball.x - ball.radius > canvas.width) {
    ball.x = -ball.radius
    ball.y = 100
    ball.vx = 3
    ball.vy = 0
  }
}