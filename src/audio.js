const STORE_KEY = "aeroputt.muted"
const BEAT = 60 / 72

const CHORDS = [
  { notes: [48, 55, 59, 64], bass: 36 },
  { notes: [45, 52, 55, 60], bass: 33 },
  { notes: [41, 48, 52, 57], bass: 29 },
  { notes: [43, 50, 57, 60], bass: 31 }
]

const ARPEGGIO = [0, 2, 1, 3, 2, 1, 3, 2]

function midi(note) {
  return 440 * Math.pow(2, (note - 69) / 12)
}

export function createAudio() {
  let ctx
  let master
  let musicBus
  let sfxBus
  let noise
  let muted = false
  let started = false
  let timer
  let next = 0
  let step = 0
  let lastBounce = 0

  try {
    muted = localStorage.getItem(STORE_KEY) === "1"
  } catch {}

  function init() {
    if (ctx) return
    const AudioCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioCtor) return

    ctx = new AudioCtor()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.62

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -16
    compressor.knee.value = 20
    compressor.ratio.value = 5
    compressor.attack.value = 0.004
    compressor.release.value = 0.25
    master.connect(compressor)
    compressor.connect(ctx.destination)

    musicBus = ctx.createGain()
    musicBus.gain.value = 0.48
    musicBus.connect(master)

    sfxBus = ctx.createGain()
    sfxBus.gain.value = 0.8
    sfxBus.connect(master)

    const reverb = ctx.createConvolver()
    reverb.buffer = createImpulse()
    const wet = ctx.createGain()
    wet.gain.value = 0.3
    const musicSend = ctx.createGain()
    musicSend.gain.value = 0.55
    const sfxSend = ctx.createGain()
    sfxSend.gain.value = 0.12
    musicBus.connect(musicSend)
    sfxBus.connect(sfxSend)
    musicSend.connect(reverb)
    sfxSend.connect(reverb)
    reverb.connect(wet)
    wet.connect(master)

    noise = createNoise()
  }

  function createNoise() {
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  function createImpulse() {
    const length = Math.floor(ctx.sampleRate * 1.7)
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.8)
      }
    }
    return buffer
  }

  function panned(node, pan) {
    if (!ctx.createStereoPanner) {
      node.connect(sfxBus)
      return
    }
    const panner = ctx.createStereoPanner()
    panner.pan.value = pan || 0
    node.connect(panner)
    panner.connect(sfxBus)
  }

  function tone(freq, at, duration, gain, type, pan, sweepTo) {
    if (!ctx || muted) return
    const t = Math.max(at, ctx.currentTime + 0.002)
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = type || "sine"
    osc.frequency.setValueAtTime(Math.max(20, freq), t)
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), t + duration)
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.006)
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(env)
    panned(env, pan)
    osc.start(t)
    osc.stop(t + duration + 0.03)
  }

  function noiseHit(at, duration, gain, type, freq, q, pan, sweepTo) {
    if (!ctx || muted) return
    const t = Math.max(at, ctx.currentTime + 0.002)
    const src = ctx.createBufferSource()
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    src.buffer = noise
    src.loop = true
    filter.type = type || "bandpass"
    filter.Q.value = q || 0.7
    filter.frequency.setValueAtTime(freq, t)
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + duration)
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.005)
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    src.connect(filter)
    filter.connect(env)
    panned(env, pan)
    src.start(t)
    src.stop(t + duration + 0.03)
  }

  function pad(freq, at, duration, gain, pan, detune) {
    if (!ctx || muted) return
    const t = Math.max(at, ctx.currentTime + 0.002)
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const env = ctx.createGain()
    const panner = ctx.createStereoPanner()
    osc.type = "triangle"
    osc.frequency.value = freq
    osc.detune.value = detune || 0
    filter.type = "lowpass"
    filter.frequency.value = 1450
    filter.Q.value = 0.4
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(gain, t + 1.4)
    env.gain.setValueAtTime(gain, t + duration - 2.2)
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    panner.pan.value = pan || 0
    osc.connect(filter)
    filter.connect(env)
    env.connect(panner)
    panner.connect(musicBus)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  }

  function bass(freq, at) {
    if (!ctx || muted) return
    const t = Math.max(at, ctx.currentTime + 0.002)
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = freq
    env.gain.setValueAtTime(0.0001, t)
    env.gain.exponentialRampToValueAtTime(0.045, t + 0.15)
    env.gain.setValueAtTime(0.045, t + BEAT * 3.4)
    env.gain.exponentialRampToValueAtTime(0.0001, t + BEAT * 4)
    osc.connect(env)
    env.connect(musicBus)
    osc.start(t)
    osc.stop(t + BEAT * 4 + 0.05)
  }

  function bell(freq, at) {
    if (!ctx || muted) return
    const t = Math.max(at, ctx.currentTime + 0.002)
    const partials = [1, 2.01]
    partials.forEach((ratio, index) => {
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      const panner = ctx.createStereoPanner()
      osc.type = "sine"
      osc.frequency.value = freq * ratio
      env.gain.setValueAtTime(0.0001, t)
      env.gain.exponentialRampToValueAtTime(index ? 0.008 : 0.045, t + 0.006)
      env.gain.exponentialRampToValueAtTime(0.0001, t + (index ? 0.55 : 1.5))
      panner.pan.value = index ? 0.25 : -0.12
      osc.connect(env)
      env.connect(panner)
      panner.connect(musicBus)
      osc.start(t)
      osc.stop(t + 1.6)
    })
  }

  function schedule() {
    if (!ctx || !started) return
    if (next < ctx.currentTime) next = ctx.currentTime + 0.05
    const horizon = ctx.currentTime + 0.9
    while (next < horizon) {
      const chord = CHORDS[Math.floor(step / 4) % CHORDS.length]
      if (step % 4 === 0) {
        chord.notes.forEach((note, index) => {
          pad(midi(note), next, BEAT * 8.4, 0.018, (index - 1.5) * 0.28, -5)
          pad(midi(note), next + 0.04, BEAT * 8.4, 0.012, (1.5 - index) * 0.22, 5)
        })
        bass(midi(chord.bass), next)
      }
      bell(midi(chord.notes[ARPEGGIO[step % ARPEGGIO.length]] + 24), next + 0.02)
      next += BEAT * 2
      step++
    }
  }

  function startMusic() {
    if (!ctx || started || muted) return
    started = true
    step = 0
    next = ctx.currentTime + 0.15
    timer = setInterval(schedule, 200)
    schedule()
  }

  function stopMusic() {
    started = false
    clearInterval(timer)
    timer = undefined
  }

  function unlock() {
    init()
    if (!ctx) return
    if (ctx.state === "suspended") ctx.resume()
    if (!muted) startMusic()
  }

  function setMuted(value) {
    muted = Boolean(value)
    try {
      localStorage.setItem(STORE_KEY, muted ? "1" : "0")
    } catch {}
    if (!ctx) {
      if (!muted) unlock()
      return muted
    }
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(muted ? 0 : 0.62, ctx.currentTime, muted ? 0.03 : 0.04)
    if (muted) stopMusic()
    else {
      unlock()
      startMusic()
    }
    return muted
  }

  function bounce(surface, impact) {
    if (!ctx || muted || impact < 0.8) return
    const t = ctx.currentTime
    if (t - lastBounce < 0.05) return
    lastBounce = t
    const amount = Math.min(1, impact / 18)
    tone(1550 + Math.random() * 500, t, 0.1, 0.03 + amount * 0.035, "sine", -0.1)
    tone(2350 + Math.random() * 700, t, 0.07, 0.012 + amount * 0.02, "sine", 0.12)
    if (surface === "sand") {
      noiseHit(t, 0.13, 0.03 + amount * 0.04, "bandpass", 1100, 0.9, 0, 500)
      tone(120, t, 0.09, 0.02 + amount * 0.025, "sine", 0)
    } else if (surface === "water") {
      noiseHit(t, 0.2, 0.04 + amount * 0.055, "bandpass", 1500, 0.8, 0, 600)
      tone(820, t, 0.16, 0.025 + amount * 0.035, "sine", 0, 280)
      noiseHit(t + 0.04, 0.11, 0.02 + amount * 0.03, "highpass", 2400, 0.7, 0.2)
    } else {
      noiseHit(t, 0.055, 0.02 + amount * 0.02, "lowpass", 800, 0.7, 0)
      tone(145, t, 0.07, 0.018 + amount * 0.02, "sine", 0)
    }
  }

  function shot(power) {
    if (!ctx || muted) return
    const t = ctx.currentTime
    const amount = Math.min(1, Math.max(0.2, power / 280))
    if (power < 70) {
      tone(260 + Math.random() * 40, t, 0.08, 0.01 + amount * 0.05, "sine", 0)
      tone(950, t, 0.045, amount * 0.015, "sine", 0.1, 500)
      noiseHit(t, 0.045, amount * 0.018, "highpass", 1800, 0.7, 0)
    } else {
      noiseHit(t, 0.26, amount * 0.05, "bandpass", 620, 1.3, -0.08, 1900)
      tone(190, t, 0.2, amount * 0.04, "sine", 0, 85)
      tone(430, t, 0.16, amount * 0.012, "triangle", 0.08, 720)
    }
  }

  function sink() {
    if (!ctx || muted) return
    const t = ctx.currentTime + 0.03
    const notes = [1046.5, 1318.5, 1568]
    notes.forEach((freq, index) => {
      tone(freq, t + index * 0.09, 0.6, 0.038, "sine", (index - 1) * 0.25)
      tone(freq * 2, t + index * 0.09, 0.35, 0.008, "sine", (index - 1) * 0.25)
    })
    tone(2093, t + 0.3, 0.8, 0.012, "sine", 0.1)
  }

  window.addEventListener("pointerdown", unlock, { once: true })
  window.addEventListener("keydown", unlock, { once: true })

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend()
    else if (!muted) ctx.resume()
  })

  return {
    unlock,
    bounce,
    shot,
    sink,
    setMuted,
    isMuted: () => muted
  }
}
