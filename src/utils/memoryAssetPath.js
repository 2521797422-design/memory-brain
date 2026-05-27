const PUBLIC_MEMORIES_PREFIX = '/memories/'

/**
 * Absolute URL for a file in `public/memories/` (leading slash + base path).
 * @param {string} fileName - e.g. `childhood.jpg` or `/memories/childhood.jpg`
 */
export function memoryPublicPath(fileName) {
  if (!fileName) return null
  const base = import.meta.env.BASE_URL || '/'
  const root = base.endsWith('/') ? base : `${base}/`
  const file = fileName
    .replace(/^\/+/, '')
    .replace(/^memories\//i, '')
  return `${root}memories/${file}`.replace(/\/{2,}/g, '/')
}

/**
 * Normalize any seed or legacy path to a public memories URL.
 * Leaves blob:, data:, and http(s): URLs unchanged.
 */
export function normalizeMemoryFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') return null

  const trimmed = filePath.trim()
  if (/^(blob:|data:|https?:)/i.test(trimmed)) return trimmed

  if (trimmed.startsWith(PUBLIC_MEMORIES_PREFIX)) {
    return memoryPublicPath(trimmed.slice(PUBLIC_MEMORIES_PREFIX.length))
  }

  if (trimmed.startsWith('memories/')) {
    return memoryPublicPath(trimmed)
  }

  if (trimmed.startsWith('public/memories/')) {
    return memoryPublicPath(trimmed.slice('public/memories/'.length))
  }

  if (!trimmed.includes('/')) {
    return memoryPublicPath(trimmed)
  }

  if (trimmed.startsWith('/')) {
    return trimmed
  }

  return memoryPublicPath(trimmed)
}

/** Resolved `src` for image/video elements. */
export function resolveMemoryMediaSrc(memory) {
  if (!memory?.filePath) return null
  return normalizeMemoryFilePath(memory.filePath)
}
