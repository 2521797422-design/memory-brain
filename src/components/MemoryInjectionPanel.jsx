import { useCallback, useEffect, useRef, useState } from 'react'
import { BRAIN_REGIONS } from '../config/brainRegions'
import { inferMediaTypeFromFile } from '../data/memories'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useMemoryRegistry } from '../context/MemoryRegistryContext'

const ACCEPT_MEDIA = 'image/*,video/*,.mov,.mp4,.webm,.jpg,.jpeg,.png,.gif,.webp'

export function MemoryInjectionPanel({ open, onClose }) {
  const { injectMemory } = useMemoryRegistry()
  const { selectMemory } = useBrainInteraction()
  const fileInputRef = useRef(null)

  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState('signal')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [textContent, setTextContent] = useState('')
  const [title, setTitle] = useState('')
  const [regionOrder, setRegionOrder] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [infusing, setInfusing] = useState(false)
  const [pulse, setPulse] = useState(false)

  const resetForm = useCallback(() => {
    setMode('signal')
    setFile(null)
    setPreviewUrl(null)
    setTextContent('')
    setTitle('')
    setRegionOrder([])
    setDragOver(false)
  }, [])

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(t)
    }
    setVisible(false)
    resetForm()
  }, [open, resetForm])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const applyFile = (nextFile) => {
    const mediaType = inferMediaTypeFromFile(nextFile)
    if (!mediaType) return
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setFile(nextFile)
    setPreviewUrl(URL.createObjectURL(nextFile))
    setMode('signal')
    setTextContent('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) applyFile(dropped)
  }

  const toggleRegion = (regionId) => {
    setRegionOrder((prev) => {
      if (prev.includes(regionId)) return prev.filter((id) => id !== regionId)
      return [...prev, regionId]
    })
  }

  const canInfuse =
    regionOrder.length > 0 &&
    ((mode === 'written' && textContent.trim().length > 0) ||
      (mode === 'signal' && file))

  const handleInfuse = async () => {
    if (!canInfuse || infusing) return
    setInfusing(true)
    try {
      const mediaType =
        mode === 'written' ? 'text' : inferMediaTypeFromFile(file)
      const newId = await injectMemory({
        title,
        mediaType,
        file: mode === 'signal' ? file : null,
        textContent: mode === 'written' ? textContent : '',
        regionIds: regionOrder,
      })
      setPulse(true)
      selectMemory(newId)
      setTimeout(() => {
        onClose()
        setPulse(false)
      }, 600)
    } catch (err) {
      console.error(err)
    } finally {
      setInfusing(false)
    }
  }

  if (!open) return null

  return (
    <div
      className={`memory-injection-overlay pointer-events-auto fixed inset-0 z-50 flex items-center justify-center px-4 py-8 pl-[88px] sm:pl-[100px] ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Inject memory"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#020108]/88 backdrop-blur-2xl"
        onClick={onClose}
        aria-label="Close injection"
      />

      <div
        className={`memory-injection-panel relative z-10 flex w-full max-w-lg flex-col transition-all duration-700 ease-out ${
          visible ? 'translate-y-0 scale-100' : 'translate-y-6 scale-[0.98]'
        } ${pulse ? 'memory-injection-pulse' : ''}`}
      >
        <header className="mb-8 text-center">
          <p className="font-body text-[9px] tracking-[0.5em] text-violet-300/40 uppercase">
            consciousness interface
          </p>
          <h2 className="font-display mt-3 text-2xl font-light italic text-violet-50/92 sm:text-3xl">
            infuse a fragment
          </h2>
          <p className="font-body mt-2 text-xs font-light text-violet-200/35">
            Not a file — a memory entering the living brain
          </p>
        </header>

        <div className="mb-6 flex justify-center gap-6">
          <button
            type="button"
            onClick={() => {
              setMode('signal')
              setTextContent('')
            }}
            className={`font-body text-[9px] tracking-[0.35em] uppercase transition-colors duration-500 ${
              mode === 'signal'
                ? 'text-violet-100/75'
                : 'text-violet-400/30 hover:text-violet-200/50'
            }`}
          >
            visual signal
          </button>
          <span className="text-violet-400/15">·</span>
          <button
            type="button"
            onClick={() => {
              setMode('written')
              setFile(null)
              if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
              setPreviewUrl(null)
            }}
            className={`font-body text-[9px] tracking-[0.35em] uppercase transition-colors duration-500 ${
              mode === 'written'
                ? 'text-violet-100/75'
                : 'text-violet-400/30 hover:text-violet-200/50'
            }`}
          >
            written fragment
          </button>
        </div>

        {mode === 'signal' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`memory-injection-well group relative mb-8 flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition-all duration-500 ${
              dragOver
                ? 'border-violet-200/40 bg-violet-200/8 shadow-[0_0_48px_rgba(180,160,220,0.15)]'
                : 'border-violet-200/15 hover:border-violet-200/28 hover:bg-violet-200/4'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_MEDIA}
              className="hidden"
              onChange={(e) => {
                const picked = e.target.files?.[0]
                if (picked) applyFile(picked)
                e.target.value = ''
              }}
            />

            {previewUrl && file ? (
              <div className="relative flex h-full w-full items-center justify-center p-4">
                {inferMediaTypeFromFile(file) === 'video' ? (
                  <video
                    src={previewUrl}
                    className="max-h-36 max-w-full rounded-sm object-contain opacity-90"
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt=""
                    className="max-h-36 max-w-full rounded-sm object-contain opacity-90"
                  />
                )}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(3,2,10,0.5)_100%)]" />
              </div>
            ) : (
              <>
                <div className="mb-3 h-10 w-10 rounded-full border border-violet-200/20 bg-violet-200/5 shadow-[0_0_24px_rgba(160,140,200,0.12)] transition-all duration-500 group-hover:shadow-[0_0_36px_rgba(180,160,220,0.2)]" />
                <p className="font-display text-sm font-light italic text-violet-100/55">
                  let a signal surface
                </p>
                <p className="font-body mt-2 text-[10px] tracking-[0.2em] text-violet-300/30">
                  drop · or reach inward
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="memory-injection-well mb-8 rounded-lg border border-violet-200/12 px-5 py-5">
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={5}
              placeholder="Words that return when you close your eyes…"
              className="memory-reflection-input font-display w-full resize-none bg-transparent text-lg font-light leading-[1.7] text-violet-50/85 italic outline-none placeholder:text-violet-200/20"
            />
          </div>
        )}

        <div className="mb-3 text-center">
          <p className="font-body text-[9px] tracking-[0.38em] text-violet-300/35 uppercase">
            neural pathways
          </p>
          <p className="font-body mt-1 text-[9px] text-violet-400/25">
            first chosen region anchors the fragment
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2.5">
          {BRAIN_REGIONS.map((region) => {
            const index = regionOrder.indexOf(region.id)
            const selected = index >= 0
            const isAnchor = index === 0
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => toggleRegion(region.id)}
                className={`font-display relative rounded-full border px-4 py-2 text-xs font-light italic capitalize transition-all duration-500 ${
                  selected
                    ? 'border-violet-200/30 bg-violet-200/10 text-violet-50/90'
                    : 'border-violet-200/10 text-violet-200/40 hover:border-violet-200/22 hover:text-violet-100/60'
                }`}
                style={{
                  boxShadow: selected ? `0 0 24px ${region.color}33` : 'none',
                }}
              >
                {region.label}
                {isAnchor && (
                  <span className="font-body absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-200/20 text-[7px] not-italic text-violet-100/70">
                    ◎
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="name this fragment (optional)"
          className="font-body mb-8 w-full border-b border-violet-200/10 bg-transparent pb-2 text-center text-xs font-light tracking-wide text-violet-100/60 outline-none placeholder:text-violet-300/25 focus:border-violet-200/25"
        />

        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            disabled={!canInfuse || infusing}
            onClick={handleInfuse}
            className={`memory-injection-infuse font-body rounded-full border px-10 py-3 text-[10px] tracking-[0.42em] uppercase transition-all duration-700 ${
              canInfuse && !infusing
                ? 'border-violet-200/35 bg-violet-200/10 text-violet-50/90 shadow-[0_0_40px_rgba(180,160,220,0.2)] hover:shadow-[0_0_56px_rgba(200,180,230,0.28)]'
                : 'cursor-not-allowed border-violet-200/8 text-violet-400/25'
            }`}
          >
            {infusing ? 'infusing…' : 'infuse into consciousness'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="font-body text-[9px] tracking-[0.3em] text-violet-400/30 uppercase transition-colors hover:text-violet-200/50"
          >
            dissolve
          </button>
        </div>
      </div>
    </div>
  )
}
