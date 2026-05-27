/**
 * Procedural dreamy ambient pad — used when no external track is available.
 */

import { getSharedAudioContext } from './sharedAudioContext'

export function createAmbientSoundscape(targetVolume = 0.25) {
  const ctx = getSharedAudioContext()
  if (!ctx) return null
  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  const padGain = ctx.createGain()
  padGain.gain.value = targetVolume
  padGain.connect(master)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 580
  filter.Q.value = 0.5
  filter.connect(padGain)

  const delay = ctx.createDelay(2.5)
  delay.delayTime.value = 0.38
  const feedback = ctx.createGain()
  feedback.gain.value = 0.22
  const delayMix = ctx.createGain()
  delayMix.gain.value = 0.3

  delay.connect(feedback)
  feedback.connect(delay)
  delay.connect(delayMix)
  delayMix.connect(master)

  const fundamentals = [110, 164.81, 220, 277.18]
  const oscillators = []

  fundamentals.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.detune.value = (i - 1.5) * 5

    const voiceGain = ctx.createGain()
    voiceGain.gain.value = 0.09 / fundamentals.length

    osc.connect(voiceGain)
    voiceGain.connect(filter)
    voiceGain.connect(delay)
    osc.start()
    oscillators.push(osc)
  })

  const filterLfo = ctx.createOscillator()
  filterLfo.type = 'sine'
  filterLfo.frequency.value = 0.035
  const filterLfoGain = ctx.createGain()
  filterLfoGain.gain.value = 140
  filterLfo.connect(filterLfoGain)
  filterLfoGain.connect(filter.frequency)
  filterLfo.start()

  const breathLfo = ctx.createOscillator()
  breathLfo.type = 'sine'
  breathLfo.frequency.value = 0.022
  const breathDepth = ctx.createGain()
  breathDepth.gain.value = targetVolume * 0.18
  breathLfo.connect(breathDepth)
  breathDepth.connect(padGain.gain)
  breathLfo.start()

  let running = false
  let fadeRaf = null

  const fadeMasterTo = (value, duration = 2.8) => {
    if (fadeRaf) cancelAnimationFrame(fadeRaf)
    const start = master.gain.value
    const startTime = ctx.currentTime
    const tick = () => {
      const t = Math.min(1, (ctx.currentTime - startTime) / duration)
      const eased = t * t * (3 - 2 * t)
      master.gain.value = start + (value - start) * eased
      if (t < 1) fadeRaf = requestAnimationFrame(tick)
      else fadeRaf = null
    }
    fadeRaf = requestAnimationFrame(tick)
  }

  return {
    ctx,
    async start() {
      if (ctx.state === 'suspended') await ctx.resume()
      running = true
      fadeMasterTo(1)
    },
    pause() {
      running = false
      fadeMasterTo(0, 1.6)
    },
    resume() {
      return this.start()
    },
    isRunning: () => running,
    dispose() {
      if (fadeRaf) cancelAnimationFrame(fadeRaf)
      oscillators.forEach((o) => {
        try {
          o.stop()
        } catch {
          /* already stopped */
        }
      })
      filterLfo.stop()
      breathLfo.stop()
    },
  }
}

export function probeAudioFile(src) {
  return new Promise((resolve) => {
    const audio = new Audio()
    const finish = (ok) => resolve(ok)
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      finish(Number.isFinite(audio.duration) && audio.duration > 1)
    }
    audio.onerror = () => finish(false)
    audio.src = src
  })
}
