import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AMBIENT_FADE_IN_S,
  AMBIENT_FADE_OUT_S,
  AMBIENT_TRACK_PATH,
  AMBIENT_VOLUME,
  MUSIC_SESSION_KEY,
} from '../config/ambientAudio'
import { createAmbientFilePlayer } from '../audio/ambientFilePlayer'
import { resumeSharedAudio } from '../audio/sharedAudioContext'
import {
  createAmbientSoundscape,
  probeAudioFile,
} from '../audio/ambientSoundscape'

const AmbientAudioContext = createContext(null)

const UNLOCK_EVENTS = ['pointerdown', 'click', 'touchstart', 'keydown']

function loadMusicSession() {
  try {
    const raw = sessionStorage.getItem(MUSIC_SESSION_KEY)
    if (raw === 'false') return false
  } catch {
    /* private mode */
  }
  return true
}

export function AmbientAudioProvider({ children }) {
  const filePlayerRef = useRef(null)
  const soundscapeRef = useRef(null)
  const modeRef = useRef('none')
  const unlockedRef = useRef(false)
  const unlockPromiseRef = useRef(null)
  const musicEnabledRef = useRef(loadMusicSession())
  const removeUnlockListenersRef = useRef(null)

  const [musicEnabled, setMusicEnabled] = useState(() => musicEnabledRef.current)
  const [ready, setReady] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  const awaitingGesture = ready && !audioUnlocked

  useEffect(() => {
    musicEnabledRef.current = musicEnabled
  }, [musicEnabled])

  const persistMusicSession = useCallback((next) => {
    try {
      sessionStorage.setItem(MUSIC_SESSION_KEY, String(next))
    } catch {
      /* ignore */
    }
  }, [])

  const startFileAudio = useCallback(async () => {
    const player = filePlayerRef.current
    if (!player) return false
    return player.start()
  }, [])

  const startSoundscape = useCallback(async () => {
    if (!soundscapeRef.current) {
      soundscapeRef.current = createAmbientSoundscape(AMBIENT_VOLUME)
    }
    const scape = soundscapeRef.current
    if (!scape) return false
    await scape.start()
    return scape.isRunning()
  }, [])

  const beginPlayback = useCallback(async () => {
    if (!musicEnabledRef.current) return false

    if (modeRef.current === 'file') {
      return startFileAudio()
    }
    if (modeRef.current === 'procedural') {
      return startSoundscape()
    }
    return false
  }, [startFileAudio, startSoundscape])

  const pausePlayback = useCallback(() => {
    if (modeRef.current === 'file' && filePlayerRef.current) {
      filePlayerRef.current.pause()
    }
    if (modeRef.current === 'procedural' && soundscapeRef.current) {
      soundscapeRef.current.pause()
    }
  }, [])

  const detachUnlockListeners = useCallback(() => {
    removeUnlockListenersRef.current?.()
    removeUnlockListenersRef.current = null
  }, [])

  const unlockAudio = useCallback(async () => {
    if (unlockedRef.current) return true

    if (unlockPromiseRef.current) {
      return unlockPromiseRef.current
    }

    unlockPromiseRef.current = (async () => {
      const resumed = await resumeSharedAudio()
      if (!resumed) {
        unlockPromiseRef.current = null
        return false
      }

      unlockedRef.current = true
      setAudioUnlocked(true)
      detachUnlockListeners()

      if (musicEnabledRef.current) {
        await beginPlayback()
      }

      unlockPromiseRef.current = null
      return true
    })()

    return unlockPromiseRef.current
  }, [beginPlayback, detachUnlockListeners])

  const attachUnlockListeners = useCallback(() => {
    detachUnlockListeners()

    const handler = () => {
      if (unlockedRef.current) return
      void unlockAudio()
    }

    const opts = { capture: true, passive: true }
    UNLOCK_EVENTS.forEach((event) => {
      window.addEventListener(event, handler, opts)
    })

    removeUnlockListenersRef.current = () => {
      UNLOCK_EVENTS.forEach((event) => {
        window.removeEventListener(event, handler, opts)
      })
    }
  }, [detachUnlockListeners, unlockAudio])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const hasFile = await probeAudioFile(AMBIENT_TRACK_PATH)

      if (cancelled) return

      if (hasFile) {
        filePlayerRef.current = createAmbientFilePlayer(
          AMBIENT_TRACK_PATH,
          AMBIENT_VOLUME,
          {
            fadeInS: AMBIENT_FADE_IN_S,
            fadeOutS: AMBIENT_FADE_OUT_S,
          },
        )
        modeRef.current = 'file'
      } else {
        soundscapeRef.current = createAmbientSoundscape(AMBIENT_VOLUME)
        modeRef.current = 'procedural'
      }

      setReady(true)
    }

    init()

    return () => {
      cancelled = true
      detachUnlockListeners()
      filePlayerRef.current?.dispose()
      soundscapeRef.current?.dispose()
      filePlayerRef.current = null
      soundscapeRef.current = null
    }
  }, [detachUnlockListeners])

  useEffect(() => {
    if (!ready) return

    if (!audioUnlocked) {
      attachUnlockListeners()
      return
    }

    detachUnlockListeners()

    if (musicEnabled) {
      void beginPlayback()
    } else {
      pausePlayback()
    }
  }, [
    ready,
    musicEnabled,
    audioUnlocked,
    beginPlayback,
    pausePlayback,
    attachUnlockListeners,
    detachUnlockListeners,
  ])

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const next = !prev
      musicEnabledRef.current = next
      persistMusicSession(next)

      if (unlockedRef.current) {
        if (next) {
          void beginPlayback()
        } else {
          pausePlayback()
        }
      }

      return next
    })
  }, [persistMusicSession, beginPlayback, pausePlayback])

  const value = useMemo(
    () => ({
      musicEnabled,
      toggleMusic,
      awaitingGesture,
      audioUnlocked,
      unlockAudio,
      ready,
    }),
    [
      musicEnabled,
      toggleMusic,
      awaitingGesture,
      audioUnlocked,
      unlockAudio,
      ready,
    ],
  )

  return (
    <AmbientAudioContext.Provider value={value}>
      {children}
    </AmbientAudioContext.Provider>
  )
}

export function useAmbientAudio() {
  const ctx = useContext(AmbientAudioContext)
  if (!ctx) {
    throw new Error('useAmbientAudio must be used within AmbientAudioProvider')
  }
  return ctx
}
