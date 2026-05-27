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
  SEED_MEMORIES,
  deriveTitleFromText,
  findMemoryById as findInList,
  getArchiveList as buildArchiveList,
  getMemoriesForRegion as getRegionMemories,
  inferMediaTypeFromFile,
} from '../data/memories'
import {
  DELETED_SEEDS_KEY,
  FORGET_DURATION_MS,
} from '../config/memoryForget'
import { deleteMemoryMedia, getMemoryMedia, putMemoryMedia } from '../utils/memoryMediaDb'
import { normalizeMemoryFilePath } from '../utils/memoryAssetPath'

const STORAGE_KEY = 'memory-brain-injected'
const REFLECTIONS_KEY = 'memory-brain-reflections'

const MemoryRegistryContext = createContext(null)

function loadInjectedRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadDeletedSeeds() {
  try {
    const raw = localStorage.getItem(DELETED_SEEDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function recordToMemory(record, filePath) {
  const resolved =
    filePath != null ? normalizeMemoryFilePath(filePath) : null
  return {
    id: record.id,
    title: record.title,
    mediaType: record.mediaType,
    filePath: resolved,
    mediaKey: record.mediaKey ?? null,
    primaryRegion: record.primaryRegion,
    secondaryRegions: record.secondaryRegions ?? [],
    emotionalTags: record.emotionalTags ?? ['injected'],
    description: record.description,
    body: record.body,
    injected: true,
  }
}

export function MemoryRegistryProvider({ children }) {
  const [injectedRecords, setInjectedRecords] = useState(loadInjectedRecords)
  const [deletedSeedIds, setDeletedSeedIds] = useState(loadDeletedSeeds)
  const [dissolvingIds, setDissolvingIds] = useState(() => new Set())
  const [dissolveEffects, setDissolveEffects] = useState([])
  const [mediaUrls, setMediaUrls] = useState({})
  const [hydrated, setHydrated] = useState(false)
  const urlsRef = useRef({})
  const forgetTimersRef = useRef(new Map())

  useEffect(() => {
    urlsRef.current = mediaUrls
  }, [mediaUrls])

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      const nextUrls = {}
      for (const record of injectedRecords) {
        if (!record.mediaKey) continue
        try {
          const blob = await getMemoryMedia(record.mediaKey)
          if (blob && !cancelled) {
            nextUrls[record.id] = URL.createObjectURL(blob)
          }
        } catch {
          /* private mode / IDB unavailable */
        }
      }
      if (!cancelled) {
        Object.values(urlsRef.current).forEach((url) => {
          if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
        })
        setMediaUrls(nextUrls)
        setHydrated(true)
      }
    }

    setHydrated(false)
    hydrate()

    return () => {
      cancelled = true
    }
  }, [injectedRecords])

  useEffect(() => {
    return () => {
      forgetTimersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const persistRecords = useCallback((records) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }, [])

  const persistDeletedSeeds = useCallback((ids) => {
    localStorage.setItem(DELETED_SEEDS_KEY, JSON.stringify(ids))
  }, [])

  const removeReflection = useCallback((memoryId) => {
    try {
      const raw = localStorage.getItem(REFLECTIONS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return
      delete parsed[memoryId]
      localStorage.setItem(REFLECTIONS_KEY, JSON.stringify(parsed))
    } catch {
      /* ignore */
    }
  }, [])

  const finalizeForget = useCallback(
    async (memoryId) => {
      const isInjected = memoryId.startsWith('injected-')
      const isSeed = SEED_MEMORIES.some((m) => m.id === memoryId)

      if (isInjected) {
        const record = injectedRecords.find((r) => r.id === memoryId)
        if (record?.mediaKey) {
          try {
            await deleteMemoryMedia(record.mediaKey)
          } catch {
            /* ignore */
          }
        }
        const url = mediaUrls[memoryId]
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
        setMediaUrls((prev) => {
          const next = { ...prev }
          delete next[memoryId]
          return next
        })
        const nextRecords = injectedRecords.filter((r) => r.id !== memoryId)
        persistRecords(nextRecords)
        setInjectedRecords(nextRecords)
      } else if (isSeed && !deletedSeedIds.includes(memoryId)) {
        const next = [...deletedSeedIds, memoryId]
        persistDeletedSeeds(next)
        setDeletedSeedIds(next)
      }

      removeReflection(memoryId)
      setDissolveEffects((prev) => prev.filter((e) => e.id !== memoryId))
      window.dispatchEvent(
        new CustomEvent('memory-forgotten', { detail: { memoryId } }),
      )
      setDissolvingIds((prev) => {
        const next = new Set(prev)
        next.delete(memoryId)
        return next
      })
      forgetTimersRef.current.delete(memoryId)
    },
    [
      injectedRecords,
      deletedSeedIds,
      mediaUrls,
      persistRecords,
      persistDeletedSeeds,
      removeReflection,
    ],
  )

  const clearDissolveEffect = useCallback((effectId) => {
    setDissolveEffects((prev) => prev.filter((e) => e.id !== effectId))
  }, [])

  const forgetMemory = useCallback(
    (memoryId, { screenX, screenY, width, height, worldAnchor } = {}) => {
      if (dissolvingIds.has(memoryId)) return

      const memory =
        findInList(
          [
            ...SEED_MEMORIES.filter((m) => !deletedSeedIds.includes(m.id)),
            ...injectedRecords.map((r) =>
              recordToMemory(r, r.mediaKey ? mediaUrls[r.id] : null),
            ),
          ],
          memoryId,
        ) ?? null

      if (!memory) return

      setDissolvingIds((prev) => new Set(prev).add(memoryId))

      setDissolveEffects((prev) => [
        ...prev.filter((e) => e.id !== memoryId),
        {
          id: memoryId,
          screenX: screenX ?? window.innerWidth / 2,
          screenY: screenY ?? window.innerHeight * 0.55,
          width,
          height,
          worldAnchor: worldAnchor ?? null,
          startedAt: Date.now(),
        },
      ])

      if (forgetTimersRef.current.has(memoryId)) {
        clearTimeout(forgetTimersRef.current.get(memoryId))
      }

      const timer = setTimeout(() => {
        finalizeForget(memoryId)
      }, FORGET_DURATION_MS)

      forgetTimersRef.current.set(memoryId, timer)
    },
    [dissolvingIds, deletedSeedIds, injectedRecords, mediaUrls, finalizeForget],
  )

  const isDissolving = useCallback(
    (memoryId) => dissolvingIds.has(memoryId),
    [dissolvingIds],
  )

  const injectedMemories = useMemo(
    () =>
      injectedRecords.map((record) =>
        recordToMemory(record, record.mediaKey ? mediaUrls[record.id] : null),
      ),
    [injectedRecords, mediaUrls],
  )

  const visibleSeeds = useMemo(
    () =>
      SEED_MEMORIES.filter((m) => !deletedSeedIds.includes(m.id)).map((m) =>
        m.filePath
          ? { ...m, filePath: normalizeMemoryFilePath(m.filePath) }
          : m,
      ),
    [deletedSeedIds],
  )

  const allMemories = useMemo(
    () => [...visibleSeeds, ...injectedMemories],
    [visibleSeeds, injectedMemories],
  )

  const findMemoryById = useCallback(
    (memoryId) => findInList(allMemories, memoryId),
    [allMemories],
  )

  const getArchiveList = useCallback(
    (filterRegionId = null) => buildArchiveList(allMemories, filterRegionId),
    [allMemories],
  )

  const getMemoriesForRegion = useCallback(
    (regionId) => getRegionMemories(allMemories, regionId),
    [allMemories],
  )

  const injectMemory = useCallback(
    async ({ title, mediaType, file, textContent, regionIds }) => {
      const regions = [...regionIds]
      if (regions.length === 0) {
        throw new Error('Select at least one brain region')
      }

      const trimmedText = textContent?.trim() ?? ''
      if (mediaType === 'text' && !trimmedText) {
        throw new Error('Write a memory fragment')
      }
      if ((mediaType === 'image' || mediaType === 'video') && !file) {
        throw new Error('Surface a visual or motion signal')
      }

      const id = `injected-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const primaryRegion = regions[0]
      const secondaryRegions = regions.slice(1)
      const resolvedTitle =
        title?.trim() ||
        (mediaType === 'text'
          ? deriveTitleFromText(trimmedText)
          : file?.name?.replace(/\.[^.]+$/, '') || 'untitled fragment')

      const description =
        mediaType === 'text'
          ? trimmedText.slice(0, 240)
          : 'A new fragment surfacing from within — held in the living archive.'

      let mediaKey = null
      if (file && (mediaType === 'image' || mediaType === 'video')) {
        mediaKey = id
        await putMemoryMedia(mediaKey, file)
      }

      const record = {
        id,
        title: resolvedTitle.toLowerCase(),
        mediaType,
        mediaKey,
        primaryRegion,
        secondaryRegions,
        emotionalTags: ['injected', 'present'],
        description,
        body: mediaType === 'text' ? trimmedText : undefined,
        createdAt: Date.now(),
      }

      const nextRecords = [...injectedRecords, record]
      persistRecords(nextRecords)
      setInjectedRecords(nextRecords)

      if (file) {
        const url = URL.createObjectURL(file)
        setMediaUrls((prev) => ({ ...prev, [id]: url }))
      }

      return id
    },
    [injectedRecords, persistRecords],
  )

  const value = useMemo(
    () => ({
      allMemories,
      findMemoryById,
      getArchiveList,
      getMemoriesForRegion,
      injectMemory,
      forgetMemory,
      isDissolving,
      dissolveEffects,
      clearDissolveEffect,
      hydrated,
      injectedCount: injectedRecords.length,
    }),
    [
      allMemories,
      findMemoryById,
      getArchiveList,
      getMemoriesForRegion,
      injectMemory,
      forgetMemory,
      isDissolving,
      dissolveEffects,
      clearDissolveEffect,
      hydrated,
      injectedRecords.length,
    ],
  )

  return (
    <MemoryRegistryContext.Provider value={value}>
      {children}
    </MemoryRegistryContext.Provider>
  )
}

export function useMemoryRegistry() {
  const ctx = useContext(MemoryRegistryContext)
  if (!ctx) {
    throw new Error(
      'useMemoryRegistry must be used within MemoryRegistryProvider',
    )
  }
  return ctx
}
