import { useAmbientAudio } from '../context/AmbientAudioContext'

/** Ambient resonance arcs — music flowing through the mind space. */
function ResonanceActive() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mind-music-icon h-[18px] w-[18px] text-violet-100/80"
      aria-hidden
    >
      <path
        d="M4 14c2.5-4 5-4 8 0s5.5 4 8 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        className="mind-music-wave mind-music-wave-1"
      />
      <path
        d="M3 12c3-5 6.5-5 9.5 0s6.5 5 9.5 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinecap="round"
        opacity="0.55"
        className="mind-music-wave mind-music-wave-2"
      />
      <circle
        cx="12"
        cy="12"
        r="1.2"
        fill="currentColor"
        className="mind-music-core"
      />
    </svg>
  )
}

/** Dormant neural pulse — music resting. */
function ResonanceDormant() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mind-music-icon h-[18px] w-[18px] text-violet-200/35"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.7"
      />
      <path
        d="M6 12h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  )
}

/** Awaiting first touch — consciousness not yet awakened. */
function ResonanceAwaiting() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mind-music-icon h-[18px] w-[18px] text-violet-200/45"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.65"
        strokeDasharray="2 3"
        className="mind-music-await-ring"
      />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

export function AmbientMusicControl() {
  const {
    musicEnabled,
    toggleMusic,
    awaitingGesture,
    ready,
    audioUnlocked,
    unlockAudio,
  } = useAmbientAudio()

  const handleClick = () => {
    if (!audioUnlocked) {
      void unlockAudio()
      return
    }
    toggleMusic()
  }

  const showActive = musicEnabled && audioUnlocked && !awaitingGesture

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready}
      title={
        awaitingGesture
          ? 'Touch the mindscape to awaken sound'
          : musicEnabled
            ? 'Let the atmosphere rest — mute ambient music'
            : 'Awaken ambient music — drift through memory'
      }
      aria-label={
        awaitingGesture
          ? 'Awaiting interaction to enable audio'
          : musicEnabled
            ? 'Turn ambient music off'
            : 'Turn ambient music on'
      }
      className={`mind-music-control group pointer-events-auto fixed top-5 right-5 z-35 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-700 sm:top-6 sm:right-6 ${
        showActive
          ? 'mind-music-control--active border-violet-200/22 bg-violet-950/30'
          : 'border-violet-200/10 bg-[#03020a]/40 hover:border-violet-200/18 hover:bg-violet-950/25'
      } border disabled:opacity-25`}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(160,140,200,0.18)_0%,transparent_72%)] opacity-40 transition-opacity duration-700 group-hover:opacity-70"
        aria-hidden
      />

      <span
        className={`pointer-events-none absolute -inset-0.5 rounded-full border border-violet-200/8 transition-opacity duration-700 ${
          showActive ? 'mind-music-glow opacity-100' : 'opacity-0'
        }`}
        aria-hidden
      />

      <span className="relative flex items-center justify-center">
        {awaitingGesture ? (
          <ResonanceAwaiting />
        ) : showActive ? (
          <ResonanceActive />
        ) : (
          <ResonanceDormant />
        )}
      </span>
    </button>
  )
}
