export function createMenu({ onToggle, onReset, audio }) {
  let open = false
  let overlay
  let resumeBtn
  let mutedBtn

  const trigger = document.createElement("button")
  trigger.className = "aero-trigger"
  trigger.setAttribute("aria-label", "Menu")
  trigger.innerHTML = '<span class="aero-burger"><i></i><i></i><i></i></span>'
  trigger.addEventListener("click", () => {
    if (!open) show()
  })
  document.body.append(trigger)

  function build() {
    overlay = document.createElement("div")
    overlay.className = "aero-overlay"
    overlay.hidden = true
    overlay.innerHTML = `<div class="aero-panel"><h2 class="aero-title">Menu</h2><button class="aero-toggle" type="button" aria-pressed="true"><span>Audio</span><span class="aero-toggle-state"><b>On</b></span></button><div class="aero-actions"><button class="aero-btn aero-btn-reset" type="button">Reset</button><button class="aero-btn aero-btn-resume" type="button">Resume</button></div></div>`

    resumeBtn = overlay.querySelector(".aero-btn-resume")
    const resetBtn = overlay.querySelector(".aero-btn-reset")
    mutedBtn = overlay.querySelector(".aero-toggle")
    const muteState = overlay.querySelector(".aero-toggle-state b")

    function syncAudio() {
      const on = !audio.isMuted()
      mutedBtn.setAttribute("aria-pressed", String(on))
      muteState.textContent = on ? "On" : "Muted"
    }

    mutedBtn.addEventListener("click", () => {
      audio.setMuted(!audio.isMuted())
      syncAudio()
    })

    resetBtn.addEventListener("click", () => {
      onReset()
      hide()
    })

    resumeBtn.addEventListener("click", hide)
    syncAudio()
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
