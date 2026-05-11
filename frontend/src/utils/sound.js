// ARGUS Sound Engine — Web Audio API, no dependencies

class SoundManager {
  constructor() {
    this.ctx = null
    this.enabled = true
    this.masterGain = 0.18
  }

  _init() {
    if (this.ctx) return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      this.enabled = false
    }
  }

  _tone(freq, duration, type = 'sine', gain = 1.0, delay = 0) {
    if (!this.enabled || !this.ctx) return
    try {
      const now = this.ctx.currentTime + delay
      const osc = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      osc.connect(g)
      g.connect(this.ctx.destination)
      osc.type = type
      osc.frequency.value = freq
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(gain * this.masterGain, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, now + duration)
      osc.start(now)
      osc.stop(now + duration + 0.05)
    } catch { /* ignore */ }
  }

  // Initialize on first user interaction (browser policy)
  activate() {
    this._init()
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume()
    }
  }

  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }

  // Radar pulse — plays periodically on Sentinel
  radar() {
    this._tone(70, 0.6, 'sine', 0.6)
    this._tone(110, 0.3, 'sine', 0.3, 0.15)
    this._tone(55, 0.8, 'sine', 0.2, 0.05)
  }

  // Critical threat alert
  alert() {
    this._tone(880, 0.15, 'square', 0.5)
    this._tone(1100, 0.12, 'square', 0.4, 0.2)
    this._tone(880, 0.15, 'square', 0.35, 0.38)
  }

  // Scan processing — subtle sweep
  scan() {
    this._tone(220, 1.2, 'sawtooth', 0.15)
    this._tone(330, 0.8, 'sine', 0.1, 0.4)
    this._tone(440, 0.6, 'sine', 0.08, 0.9)
  }

  // Confirmation / safe
  confirm() {
    this._tone(523, 0.12, 'sine', 0.4)
    this._tone(659, 0.15, 'sine', 0.3, 0.14)
    this._tone(784, 0.2, 'sine', 0.2, 0.28)
  }

  // Module switch click
  click() {
    this._tone(440, 0.06, 'sine', 0.3)
  }

  // Timeline generate — cinematic
  correlate() {
    this._tone(110, 0.3, 'sine', 0.4)
    this._tone(220, 0.25, 'sine', 0.3, 0.2)
    this._tone(330, 0.2, 'sine', 0.25, 0.38)
    this._tone(440, 0.3, 'sine', 0.2, 0.52)
    this._tone(550, 0.4, 'sine', 0.15, 0.7)
  }
}

export const sound = new SoundManager()
