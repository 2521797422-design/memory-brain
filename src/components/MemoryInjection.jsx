import { useState } from 'react'
import { MemoryInjectionPanel } from './MemoryInjectionPanel'
import { useBrainInteraction } from '../context/BrainInteractionContext'

export function MemoryInjection() {
  const [open, setOpen] = useState(false)
  const { openMemoryId } = useBrainInteraction()

  if (openMemoryId) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inject-memory-trigger group pointer-events-auto fixed bottom-44 right-24 z-35 flex items-center gap-2.5 sm:right-28"
        aria-label="Inject memory"
      >
        <span className="inject-memory-glow pointer-events-none absolute inset-0 -m-2 rounded-full opacity-60" />
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-violet-200/25 bg-violet-200/8 text-lg font-extralight text-violet-100/80 shadow-[0_0_28px_rgba(180,160,220,0.2)] transition-all duration-500 group-hover:border-violet-200/40 group-hover:shadow-[0_0_40px_rgba(200,180,230,0.35)]">
          +
        </span>
        <span className="font-body relative hidden text-[10px] tracking-[0.28em] text-violet-200/50 uppercase transition-colors duration-500 group-hover:text-violet-100/70 sm:inline">
          Inject Memory
        </span>
      </button>

      <MemoryInjectionPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
