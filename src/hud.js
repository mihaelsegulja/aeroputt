export function scoreText(score) {
  if (score === 0) return "E"
  return score > 0 ? `+${score}` : `${score}`
}

export function createHud() {
  const root = document.createElement("div")
  root.className = "hud"
  root.innerHTML = `
    <div class="hud-head">
      <span>Hole <b class="hole">1</b></span>
      <span>Par <b class="par">2</b></span>
    </div>
    <div class="hud-pin"><b class="pin">0</b><span>m to pin</span></div>
    <div class="hud-row">
      <span>Strokes <b class="strokes">0</b></span>
      <span>Shots <b class="shots">0</b></span>
    </div>
    <div class="hud-row hud-foot">
      <span>Passed <b class="passed">0</b></span>
      <span>Total <b class="score">E</b></span>
      <span>Net <b class="net">0 m</b></span>
    </div>
  `

  const holeEl = root.querySelector(".hole")
  const parEl = root.querySelector(".par")
  const pinEl = root.querySelector(".pin")
  const strokesEl = root.querySelector(".strokes")
  const shotsEl = root.querySelector(".shots")
  const passedEl = root.querySelector(".passed")
  const scoreEl = root.querySelector(".score")
  const netEl = root.querySelector(".net")

  const toast = document.createElement("div")
  toast.className = "toast"

  const toastTitle = document.createElement("b")
  const toastSub = document.createElement("span")
  toast.append(toastTitle, toastSub)

  let toastTimer

  function set(el, value) {
    if (el.textContent !== value) el.textContent = value
  }

  function update(state) {
    set(holeEl, String(state.hole))
    set(parEl, String(state.par))
    set(pinEl, String(state.toPin))
    set(strokesEl, String(state.strokes))
    set(shotsEl, String(state.shots))
    set(passedEl, String(state.passed))
    set(scoreEl, scoreText(state.score))
    set(netEl, `${state.net > 0 ? "+" : ""}${state.net} m`)
  }

  function showToast(title, sub) {
    toastTitle.textContent = title
    toastSub.textContent = sub
    toast.classList.add("show")
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toast.classList.remove("show")
    }, 1600)
  }

  function clearToast() {
    clearTimeout(toastTimer)
    toast.classList.remove("show")
  }

  document.body.append(root, toast)

  return { update, showToast, clearToast }
}
