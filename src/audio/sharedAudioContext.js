/**
 * Single Web Audio context for ambient + UI — avoids suspended/blocked duplicate contexts.
 */

let sharedCtx = null

export function getSharedAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null

  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AudioCtx()
  }
  return sharedCtx
}

export async function resumeSharedAudio() {
  const ctx = getSharedAudioContext()
  if (!ctx) return false
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  return ctx.state === 'running'
}

export function isSharedAudioRunning() {
  return sharedCtx?.state === 'running'
}
