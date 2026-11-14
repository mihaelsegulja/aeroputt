export function createMenu({ onToggle, onReset, audio }) {
  let open = false
  let overlay
  let resumeBtn
  let mutedBtn

  const trigger = document.createElement("button")
  trigger.className = "trg"
  trigger.setAttribute("aria-label", "Menu")
  trigger.innerHTML = '<span class="brg"><i></i><i></i><i></i></span>'
  trigger.addEventListener("click", () => {
    if (!open) show()
  })
  document.body.append(trigger)

  function build() {
    overlay = document.createElement("div")
    overlay.className = "ovrl"
    overlay.hidden = true
    overlay.innerHTML = `<div class="pnl"><h2 class="ttl">MENU</h2><button class="tgl btn" type="button" aria-pressed="true"><span>Audio</span><span class="tgl-state"><b>On</b></span></button><div class="act"><button class="btn btn-reset" type="button">Reset</button><button class="btn btn-resume" type="button">Resume</button></div></div>`

    resumeBtn = overlay.querySelector(".btn-resume")
    const resetBtn = overlay.querySelector(".btn-reset")
    mutedBtn = overlay.querySelector(".tgl")
    const muteState = overlay.querySelector(".tgl-state b")

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
    if (e.key.toLowerCase() === "m") open ? hide() : show()
  })

}
