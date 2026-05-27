/**
 * Plays the custom UI sample with cinematic fades and single-voice overlap control.
 */

import { getSharedAudioContext, resumeSharedAudio } from './sharedAudioContext'

export function createUiSamplePlayer({
  src,
  peakGain,
  retriggerGain,
  fadeInS,
  fadeOutS,
  minGapMs,
  crossfadeMs,
  lowpassHz,
  playbackRate,
}) {
  if (!getSharedAudioContext()) return null

  let buffer = null
  let outputGain = null
  let warmthFilter = null
  let ready = false
  let loadPromise = null
  let graphReady = false

  let activeSource = null
  let activeGain = null
  let lastTriggerAt = 0
  let voiceId = 0

  const ensureGraph = () => {
    if (graphReady) return getSharedAudioContext()
    const ctx = getSharedAudioContext()
    if (!ctx) return null

    outputGain = ctx.createGain()
    outputGain.gain.value = 1

    warmthFilter = ctx.createBiquadFilter()
    warmthFilter.type = 'lowpass'
    warmthFilter.frequency.value = lowpassHz
    warmthFilter.Q.value = 0.6

    warmthFilter.connect(outputGain)
    outputGain.connect(ctx.destination)
    graphReady = true
    return ctx
  }

  const loadBuffer = async () => {
    if (buffer) return buffer
    if (loadPromise) return loadPromise

    loadPromise = (async () => {
      const ctx = ensureGraph()
      if (!ctx) throw new Error('Web Audio unavailable')
      const response = await fetch(src)
      if (!response.ok) throw new Error(`UI sample not found: ${src}`)
      const arrayBuffer = await response.arrayBuffer()
      buffer = await ctx.decodeAudioData(arrayBuffer)
      ready = true
      return buffer
    })()

    return loadPromise
  }

  const fadeOutActive = (durationMs) => {
    const ctx = getSharedAudioContext()
    if (!activeSource || !activeGain || !ctx) return

    const voice = voiceId
    const source = activeSource
    const gain = activeGain
    const fadeS = durationMs / 1000
    const t = ctx.currentTime

    gain.gain.cancelScheduledValues(t)
    const current = Math.max(gain.gain.value, 0.0001)
    gain.gain.setValueAtTime(current, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + fadeS)

    window.setTimeout(() => {
      if (voiceId !== voice) return
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
      if (activeSource === source) {
        activeSource = null
        activeGain = null
      }
    }, durationMs + 30)
  }

  return {
    async prepare() {
      await loadBuffer()
      return ready
    },

    isReady: () => ready,

    /**
     * @param {{ volumeScale?: number, allowRetrigger?: boolean }} [opts]
     */
    async play(opts = {}) {
      const { volumeScale = 1, allowRetrigger = true } = opts
      await loadBuffer()
      if (!ready || !(await resumeSharedAudio())) return false

      const now = Date.now()
      const elapsed = now - lastTriggerAt
      const overlapping = Boolean(activeSource)

      if (!overlapping && elapsed < minGapMs && !allowRetrigger) {
        return false
      }

      if (overlapping) {
        fadeOutActive(crossfadeMs)
      } else if (elapsed < minGapMs) {
        return false
      }

      lastTriggerAt = now
      voiceId += 1
      const voice = voiceId

      const ctx = getSharedAudioContext()
      if (!ctx) return false

      const t = ctx.currentTime
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.playbackRate.value = playbackRate

      const voiceGain = ctx.createGain()
      const targetPeak = overlapping
        ? retriggerGain * volumeScale
        : peakGain * volumeScale

      const duration = buffer.duration / playbackRate
      const fadeOutStart = Math.max(fadeInS + 0.02, duration - fadeOutS)

      voiceGain.gain.setValueAtTime(0.0001, t)
      voiceGain.gain.exponentialRampToValueAtTime(
        Math.max(targetPeak, 0.0002),
        t + fadeInS,
      )
      voiceGain.gain.setValueAtTime(targetPeak, t + fadeOutStart)
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, t + duration)

      source.connect(voiceGain)
      voiceGain.connect(warmthFilter)

      source.onended = () => {
        if (voiceId !== voice) return
        if (activeSource === source) {
          activeSource = null
          activeGain = null
        }
      }

      activeSource = source
      activeGain = voiceGain
      source.start(t, 0, duration + 0.02)

      return true
    },

    dispose() {
      fadeOutActive(crossfadeMs)
      loadPromise = null
      buffer = null
      ready = false
      graphReady = false
      outputGain = null
      warmthFilter = null
    },
  }
}

export function probeUiSample(src) {
  return new Promise((resolve) => {
    const audio = new Audio()
    const finish = (ok) => resolve(ok)
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      finish(Number.isFinite(audio.duration) && audio.duration > 0.02)
    }
    audio.onerror = () => finish(false)
    audio.src = src
  })
}
