export function scoreText(score) {
  if (score === 0) return "E"
  return score > 0 ? `+${score}` : `${score}`
}

export function createHud() {
  const root = document.createElement("div")
  root.className = "aero-hud"
  root.innerHTML = `
    <div class="aero-hud-head">
      <span>Hole <b class="aero-hole">1</b></span>
      <span>Par <b class="aero-par">2</b></span>
    </div>
    <div class="aero-hud-pin"><b class="aero-pin">0</b><span>m to pin</span></div>
    <div class="aero-hud-row">
      <span>Strokes <b class="aero-strokes">0</b></span>
      <span>Shots <b class="aero-shots">0</b></span>
    </div>
    <div class="aero-hud-row aero-hud-foot">
      <span>Passed <b class="aero-passed">0</b></span>
      <span>Total <b class="aero-score">E</b></span>
      <span>Net <b class="aero-net">0 m</b></span>
    </div>
  `

  const holeEl = root.querySelector(".aero-hole")
  const parEl = root.querySelector(".aero-par")
  const pinEl = root.querySelector(".aero-pin")
  const strokesEl = root.querySelector(".aero-strokes")
  const shotsEl = root.querySelector(".aero-shots")
  const passedEl = root.querySelector(".aero-passed")
  const scoreEl = root.querySelector(".aero-score")
  const netEl = root.querySelector(".aero-net")

  const toast = document.createElement("div")
  toast.className = "aero-toast"

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
