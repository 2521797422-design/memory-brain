import { MemoryImage } from './MemoryImage'

/** Shared thumbnail surface for strip + floating views (presentation only). */
export function MemoryMediaThumb({
  memory,
  className = 'h-full w-full object-cover',
  textClassName = 'font-display text-center text-[10px] font-light italic leading-tight text-violet-100/50',
}) {
  if (!memory) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-violet-950/50">
        <span className="text-violet-300/30">···</span>
      </div>
    )
  }

  if (memory.mediaType === 'image' && memory.filePath) {
    return (
      <MemoryImage memory={memory} className={className} alt="" loading="lazy" />
    )
  }

  if (memory.mediaType === 'video') {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-violet-900/55 to-violet-950/80"
        aria-hidden
      >
        <span className="mb-1 text-lg text-violet-200/35" aria-hidden>
          ▶
        </span>
        <span className="font-body text-[7px] tracking-[0.28em] text-violet-200/30 uppercase">
          reel
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-violet-900/40 to-violet-950/60 p-2">
      <span className={textClassName}>{memory.title ?? 'fragment'}</span>
    </div>
  )
}
