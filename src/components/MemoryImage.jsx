import { useState } from 'react'
import { resolveMemoryMediaSrc } from '../utils/memoryAssetPath'

/**
 * Image preview with normalized public paths and a soft fallback when the asset is missing.
 */
export function MemoryImage({
  memory,
  className = '',
  alt = '',
  loading = 'lazy',
}) {
  const src = resolveMemoryMediaSrc(memory)
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-violet-900/50 to-violet-950/75 ${className}`}
        role="img"
        aria-label={alt || memory?.title || 'memory'}
      >
        <span className="font-body text-[8px] tracking-[0.25em] text-violet-300/35 uppercase">
          signal lost
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt || memory?.title || ''}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
