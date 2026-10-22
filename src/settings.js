export function createSettings(onToggle, seed) {
  let open = false
  let overlay
  let resumeBtn

  const trigger = document.createElement("button")
  trigger.className = "aero-trigger"
  trigger.setAttribute("aria-label", "Settings")
  trigger.innerHTML = "<span>⚙</span>"
  trigger.addEventListener("click", () => {
    if (!open) show()
  })
  document.body.append(trigger)

  function build() {
    overlay = document.createElement("div")
    overlay.className = "aero-overlay"
    overlay.hidden = true
    overlay.innerHTML = `<div class="aero-panel"><h2 class="aero-title">Settings</h2><p class="aero-seed">Course seed <span>${seed.toString(36).toUpperCase()}</span></p><button class="aero-btn" type="button">Resume</button></div>`

    resumeBtn = overlay.querySelector(".aero-btn")
    resumeBtn.addEventListener("click", hide)
    document.body.append(overlay)
  }

  function show() {
    if (open) return
    if (!overlay) build()
    open = true
    overlay.hidden = false
    resumeBtn.focus()
    onToggle(true)
  }

  function hide() {
    if (!open) return
    open = false
    overlay.hidden = true
    resumeBtn.blur()
    onToggle(false)
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !open) show()
  })

}
