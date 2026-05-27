import { useEffect, useRef, useState } from 'react'
import { MemoryReflectionPanel } from './MemoryReflectionPanel'
import { MemoryImage } from './MemoryImage'
import { MemoryVideoPlayer } from './MemoryVideoPlayer'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useMemoryRegistry } from '../context/MemoryRegistryContext'
import { ForgetMemoryButton } from './ForgetMemoryButton'
import { useImmersiveVideo } from '../hooks/useImmersiveVideo'

export function MemoryViewer() {
  const {
    openMemory,
    closeMemory,
    focusedConfig,
    clearFocus,
    isFocused,
    openMemoryId,
  } = useBrainInteraction()
  const { forgetMemory, isDissolving } = useMemoryRegistry()
  const [visible, setVisible] = useState(false)
  const mediaRef = useRef(null)
  const immersiveVideo = useImmersiveVideo()

  const dissolving = openMemoryId ? isDissolving(openMemoryId) : false
  const videoActive = immersiveVideo && visible && !dissolving

  useEffect(() => {
    if (openMemory && !dissolving) {
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    }
    if (dissolving) setVisible(false)
    else setVisible(false)
  }, [openMemory, dissolving])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (openMemory) closeMemory()
        else if (isFocused) clearFocus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openMemory, closeMemory, clearFocus, isFocused])

  const handleForget = (e) => {
    if (!openMemory) return
    const rect =
      mediaRef.current?.getBoundingClientRect() ??
      e.currentTarget.getBoundingClientRect()
    forgetMemory(openMemory.id, {
      screenX: rect.left + rect.width / 2,
      screenY: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height,
    })
  }

  if (!openMemory) return null

  const regionLabel = focusedConfig?.label ?? openMemory.primaryRegion

  return (
    <div
      className={`memory-focus-mode group/viewer pointer-events-auto fixed inset-0 z-40 flex flex-col pl-[88px] transition-opacity duration-1000 ease-out sm:pl-[100px] ${
        dissolving ? 'memory-dissolving pointer-events-none' : visible
          ? 'opacity-100'
          : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={openMemory.title}
      data-memory-open={openMemoryId ?? undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#020108]/92 backdrop-blur-2xl"
        onClick={closeMemory}
        aria-label="Close memory"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_38%,rgba(140,110,150,0.14)_0%,transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_100%,rgba(3,2,10,0.6)_0%,transparent_55%)]" />

      <header className="relative z-10 flex shrink-0 items-start justify-between px-6 pt-8 sm:px-10 sm:pt-10">
        <div className="min-w-0">
          <p className="font-body text-[9px] tracking-[0.45em] text-violet-300/35 uppercase">
            deep memory · {regionLabel}
          </p>
          <h2 className="font-display mt-2 text-2xl font-light italic text-violet-50/95 sm:text-3xl">
            {openMemory.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-start gap-4">
          {!dissolving && (
            <ForgetMemoryButton
              className="relative opacity-0 group-hover/viewer:opacity-100"
              onForget={handleForget}
            />
          )}
          <button
            type="button"
            onClick={closeMemory}
            className="font-body pt-1 text-[10px] tracking-[0.32em] text-violet-300/40 uppercase transition-colors hover:text-violet-100/65"
          >
            release
          </button>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 py-6 sm:px-10 lg:flex-row lg:items-center lg:gap-12 lg:overflow-hidden lg:py-8">
        <div
          ref={mediaRef}
          className={`flex flex-1 items-center justify-center transition-all duration-1000 ease-out lg:min-h-0 ${
            visible && !dissolving ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0'
          }`}
        >
          {openMemory.mediaType === 'text' && (
            <div className="pointer-events-none flex h-[min(40vh,280px)] w-full max-w-lg items-center justify-center rounded-lg border border-violet-200/10 bg-violet-950/30 backdrop-blur-sm">
              <p className="font-display px-8 text-center text-lg font-light italic text-violet-100/50">
                {openMemory.title}
              </p>
            </div>
          )}

          {openMemory.mediaType === 'image' && openMemory.filePath && (
            <figure className="relative w-full max-w-3xl lg:max-w-4xl">
              <div className="relative overflow-hidden rounded-sm">
                <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,1,8,0.65)_100%)]" />
                <MemoryImage
                  memory={openMemory}
                  alt={openMemory.title}
                  loading="eager"
                  className={`mx-auto w-auto max-w-full object-contain transition-all duration-1000 ease-out ${
                    visible && !dissolving
                      ? 'max-h-[min(58vh,720px)] opacity-95'
                      : 'max-h-[50vh] opacity-0'
                  }`}
                />
              </div>
            </figure>
          )}

          {openMemory.mediaType === 'video' && (
            <figure
              className={`relative w-full max-w-3xl transition-all duration-1000 ease-out lg:max-w-4xl ${
                visible && !dissolving ? 'scale-100 opacity-100' : 'scale-[0.97] opacity-0'
              }`}
              aria-hidden
            >
              <div
                className="mx-auto flex aspect-video w-full max-w-3xl items-center justify-center rounded-sm border border-violet-200/10 bg-violet-950/40"
                style={{ maxHeight: 'min(58vh, 720px)' }}
              >
                <p className="font-body text-center text-[10px] tracking-[0.35em] text-violet-300/35 uppercase">
                  reel · use controls to play
                </p>
              </div>
            </figure>
          )}
        </div>

        <MemoryReflectionPanel memory={openMemory} visible={visible && !dissolving} />
      </div>

      {openMemory.mediaType === 'video' && openMemory.filePath && (
        <MemoryVideoPlayer
          key={openMemory.id}
          filePath={openMemory.filePath}
          title={openMemory.title}
          active={videoActive}
        />
      )}

      <footer className="relative z-10 flex shrink-0 justify-center pb-8 pt-2">
        <button
          type="button"
          onClick={closeMemory}
          className="font-body text-[9px] tracking-[0.3em] text-violet-300/30 uppercase transition-colors hover:text-violet-200/50"
        >
          return to drift
        </button>
      </footer>
    </div>
  )
}
