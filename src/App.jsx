import { useEffect, useRef } from 'react'
import { SceneFrame } from './components/SceneFrame'
import { NeuralJoystick } from './components/NeuralJoystick'
import { MemoryViewer } from './components/MemoryViewer'
import { RegionNav } from './components/RegionNav'
import { MemoryStrip } from './components/MemoryStrip'
import { BrainRotationProvider } from './context/BrainRotationContext'
import { BrainInteractionProvider } from './context/BrainInteractionContext'
import { BrainModelProvider } from './context/BrainModelContext'
import { MemoryReflectionProvider } from './context/MemoryReflectionContext'
import { MemoryRegistryProvider } from './context/MemoryRegistryContext'
import { MemoryInjection } from './components/MemoryInjection'
import { AmbientMusicControl } from './components/AmbientMusicControl'
import { MemoryForgetOverlay } from './components/MemoryForgetOverlay'
import { AmbientAudioProvider } from './context/AmbientAudioContext'
import { UiAudioProvider } from './context/UiAudioContext'
import { BrainInteractionSoundBridge } from './components/BrainInteractionSoundBridge'
import { useMouseParallax } from './hooks/useMouseParallax'
import { useBrainInteraction } from './context/BrainInteractionContext'

function HeroOverlay() {
  const overlayRef = useRef(null)
  const lerpMouse = useMouseParallax()
  const { isFocused, openMemory, activeMemoryId } = useBrainInteraction()

  useEffect(() => {
    let frame
    const tick = () => {
      if (overlayRef.current) {
        const { x, y } = lerpMouse(0.06)
        overlayRef.current.style.transform = `translate(${x * 18}px, ${y * 14}px)`
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [lerpMouse])

  const hidden = isFocused || openMemory

  return (
    <main
      ref={overlayRef}
      className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 pb-36 pl-[88px] text-center transition-all duration-1000 ease-out sm:pl-[100px] ${
        hidden ? 'scale-[0.98] opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      <p className="font-body mb-4 text-xs font-light uppercase tracking-[0.45em] text-violet-300/50">
        a digital sanctuary
      </p>
      <h1 className="font-display mb-6 max-w-2xl text-5xl font-light leading-[1.15] tracking-wide text-violet-50/90 sm:text-6xl md:text-7xl">
        <span className="italic text-violet-200/80">Memory</span>
        <br />
        <span className="text-3xl font-extralight text-violet-100/40 sm:text-4xl">
          where thought becomes light
        </span>
      </h1>
      <p className="font-body max-w-md text-sm font-light leading-relaxed text-violet-200/35 sm:text-base">
        Touch a region of the brain — its memories will surface below and around you.
      </p>
    </main>
  )
}

function JoystickLayer() {
  const { openMemoryId } = useBrainInteraction()

  return (
    <div
      className={`fixed bottom-44 right-6 z-30 transition-all duration-1000 ease-out sm:bottom-48 sm:right-10 ${
        openMemoryId ? 'pointer-events-none opacity-20' : 'opacity-100'
      }`}
    >
      <NeuralJoystick />
    </div>
  )
}

function AppShell() {
  return (
    <div className="relative h-screen w-screen min-h-[100dvh] min-w-full overflow-hidden bg-[#03020a]">
      <SceneFrame />

      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(120,90,110,0.1)_0%,transparent_68%)]"
        aria-hidden
      />

      <RegionNav />
      <HeroOverlay />
      <MemoryStrip />

      <JoystickLayer />

      <MemoryViewer />
      <MemoryInjection />
      <AmbientMusicControl />
      <MemoryForgetOverlay />
    </div>
  )
}

function App() {
  return (
    <AmbientAudioProvider>
      <BrainRotationProvider>
        <BrainModelProvider>
          <MemoryRegistryProvider>
            <BrainInteractionProvider>
              <UiAudioProvider>
                <BrainInteractionSoundBridge />
                <MemoryReflectionProvider>
                  <AppShell />
                </MemoryReflectionProvider>
              </UiAudioProvider>
            </BrainInteractionProvider>
          </MemoryRegistryProvider>
        </BrainModelProvider>
      </BrainRotationProvider>
    </AmbientAudioProvider>
  )
}

export default App
