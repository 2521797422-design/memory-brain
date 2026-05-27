/**
 * Looping ambient file with Web Audio gain — cinematic fade-in/out, no player UI feel.
 */

import { getSharedAudioContext, resumeSharedAudio } from './sharedAudioContext'

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

export function createAmbientFilePlayer(
  src,
  targetVolume,
  { fadeInS = 4.8, fadeOutS = 2.4 } = {},
) {
  const audio = new Audio(src)
  audio.loop = true
  audio.preload = 'auto'

  let gainNode = null
  let connected = false
  let running = false
  let volumeRaf = null

  const connectGraph = () => {
    if (connected) return true
    const ctx = getSharedAudioContext()
    if (!ctx) return false
    try {
      const source = ctx.createMediaElementSource(audio)
      gainNode = ctx.createGain()
      gainNode.gain.value = 0
      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      connected = true
      return true
    } catch {
      return false
    }
  }

  const rampElementVolume = (toValue, durationS, onDone) => {
    if (volumeRaf) cancelAnimationFrame(volumeRaf)
    const from = audio.volume
    const start = performance.now()
    const durationMs = durationS * 1000

    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / durationMs)
      audio.volume = from + (toValue - from) * smoothstep(t)
      if (t < 1) {
        volumeRaf = requestAnimationFrame(tick)
      } else {
        volumeRaf = null
        onDone?.()
      }
    }
    volumeRaf = requestAnimationFrame(tick)
  }

  const rampGain = (toValue, durationS, onDone) => {
    const ctx = getSharedAudioContext()
    if (!gainNode || !ctx) {
      rampElementVolume(toValue, durationS, onDone)
      return
    }

    const t0 = ctx.currentTime
    gainNode.gain.cancelScheduledValues(t0)
    const current = Math.max(gainNode.gain.value, 0.0001)
    gainNode.gain.setValueAtTime(current, t0)
    gainNode.gain.exponentialRampToValueAtTime(
      Math.max(toValue, 0.0001),
      t0 + durationS,
    )

    if (onDone) {
      window.setTimeout(onDone, durationS * 1000 + 40)
    }
  }

  return {
    async start() {
      await resumeSharedAudio()
      connectGraph()

      if (!connected) {
        audio.volume = 0
      }

      try {
        if (audio.paused) await audio.play()
      } catch {
        running = false
        return false
      }

      running = true
      if (gainNode) {
        gainNode.gain.value = 0.0001
      }
      rampGain(targetVolume, fadeInS)
      return !audio.paused
    },

    pause() {
      running = false

      const finish = () => {
        audio.pause()
        if (gainNode) {
          gainNode.gain.value = 0
        } else {
          audio.volume = 0
        }
      }

      if (!audio.paused) {
        rampGain(0.0001, fadeOutS, finish)
      } else {
        finish()
      }
    },

    isRunning: () => running && !audio.paused,

    dispose() {
      if (volumeRaf) cancelAnimationFrame(volumeRaf)
      running = false
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      gainNode = null
      connected = false
    },
  }
}
