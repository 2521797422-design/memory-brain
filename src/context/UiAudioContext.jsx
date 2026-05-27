import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createUiSamplePlayer, probeUiSample } from '../audio/uiSamplePlayer'
import {
  UI_INTERACTION_SAMPLE_PATH,
  UI_MEMORY_HOVER_VOLUME_SCALE,
  UI_OPEN_SUPPRESS_HOVER_MS,
  UI_SAMPLE_CROSSFADE_MS,
  UI_SAMPLE_FADE_IN_S,
  UI_SAMPLE_FADE_OUT_S,
  UI_SAMPLE_LOWPASS_HZ,
  UI_SAMPLE_MIN_GAP_MS,
  UI_SAMPLE_PEAK_GAIN,
  UI_SAMPLE_PLAYBACK_RATE,
  UI_SAMPLE_RETRIGGER_GAIN,
} from '../config/uiAudio'
import { useAmbientAudio } from './AmbientAudioContext'

const UiAudioContext = createContext(null)

export function UiAudioProvider({ children }) {
  const { audioUnlocked, unlockAudio } = useAmbientAudio()
  const playerRef = useRef(null)
  const unlockedRef = useRef(audioUnlocked)
  const lastHoverRef = useRef({ id: null, at: 0 })
  const suppressHoverUntilRef = useRef(0)
  const [sampleReady, setSampleReady] = useState(false)

  useEffect(() => {
    unlockedRef.current = audioUnlocked
  }, [audioUnlocked])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const ok = await probeUiSample(UI_INTERACTION_SAMPLE_PATH)
      if (cancelled || !ok) return

      playerRef.current = createUiSamplePlayer({
        src: UI_INTERACTION_SAMPLE_PATH,
        peakGain: UI_SAMPLE_PEAK_GAIN,
        retriggerGain: UI_SAMPLE_RETRIGGER_GAIN,
        fadeInS: UI_SAMPLE_FADE_IN_S,
        fadeOutS: UI_SAMPLE_FADE_OUT_S,
        minGapMs: UI_SAMPLE_MIN_GAP_MS,
        crossfadeMs: UI_SAMPLE_CROSSFADE_MS,
        lowpassHz: UI_SAMPLE_LOWPASS_HZ,
        playbackRate: UI_SAMPLE_PLAYBACK_RATE,
      })

      try {
        const loaded = await playerRef.current.prepare()
        if (!cancelled && loaded) setSampleReady(true)
      } catch (err) {
        console.warn('[UiAudio] Failed to load interaction sample:', err)
      }
    }

    init()

    return () => {
      cancelled = true
      playerRef.current?.dispose()
      playerRef.current = null
      setSampleReady(false)
    }
  }, [])

  const ensureUnlockedAndReady = useCallback(async () => {
    if (!playerRef.current || !sampleReady) return false
    await unlockAudio()
    if (!unlockedRef.current || !playerRef.current?.isReady()) return false
    return true
  }, [sampleReady, unlockAudio])

  const playInteraction = useCallback(
    async (volumeScale = 1) => {
      if (!(await ensureUnlockedAndReady())) return
      await playerRef.current.play({ volumeScale })
    },
    [ensureUnlockedAndReady],
  )

  const playMemoryHover = useCallback(
    async (memoryId) => {
      if (!memoryId) return

      const now = Date.now()
      if (now < suppressHoverUntilRef.current) return

      const last = lastHoverRef.current
      if (last.id === memoryId && now - last.at < UI_SAMPLE_MIN_GAP_MS) return

      lastHoverRef.current = { id: memoryId, at: now }
      await playInteraction(UI_MEMORY_HOVER_VOLUME_SCALE)
    },
    [playInteraction],
  )

  const playMemoryOpen = useCallback(async () => {
    suppressHoverUntilRef.current = Date.now() + UI_OPEN_SUPPRESS_HOVER_MS
    await playInteraction(1)
  }, [playInteraction])

  const value = useMemo(
    () => ({
      sampleReady,
      playInteraction: (volumeScale) => {
        void playInteraction(volumeScale)
      },
      playMemoryHover: (memoryId) => {
        void playMemoryHover(memoryId)
      },
      playMemoryOpen: () => {
        void playMemoryOpen()
      },
    }),
    [sampleReady, playInteraction, playMemoryHover, playMemoryOpen],
  )

  return (
    <UiAudioContext.Provider value={value}>{children}</UiAudioContext.Provider>
  )
}

export function useUiAudio() {
  const ctx = useContext(UiAudioContext)
  if (!ctx) {
    throw new Error('useUiAudio must be used within UiAudioProvider')
  }
  return ctx
}
