import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useMemoryRegistry } from './MemoryRegistryContext'

const STORAGE_KEY = 'memory-brain-reflections'
const SAVE_DELAY_MS = 450

const MemoryReflectionContext = createContext(null)

function loadReflections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function getDefaultReflection(memory) {
  if (!memory) return ''
  if (memory.mediaType === 'text' && memory.body) return memory.body
  return memory.description ?? ''
}

export function MemoryReflectionProvider({ children }) {
  const { findMemoryById } = useMemoryRegistry()
  const [reflections, setReflections] = useState(loadReflections)
  const [savePulse, setSavePulse] = useState(false)
  const saveTimerRef = useRef(null)
  const pulseTimerRef = useRef(null)

  const persist = useCallback((next) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        setSavePulse(true)
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
        pulseTimerRef.current = setTimeout(() => setSavePulse(false), 1800)
      } catch {
        /* storage full or private mode */
      }
    }, SAVE_DELAY_MS)
  }, [])

  const getReflection = useCallback(
    (memoryOrId) => {
      const memory =
        typeof memoryOrId === 'string'
          ? findMemoryById(memoryOrId)
          : memoryOrId
      if (!memory) return ''
      if (reflections[memory.id] !== undefined) {
        return reflections[memory.id]
      }
      return getDefaultReflection(memory)
    },
    [reflections, findMemoryById],
  )

  const setReflection = useCallback(
    (memoryId, text) => {
      setReflections((prev) => {
        const next = { ...prev, [memoryId]: text }
        persist(next)
        return next
      })
    },
    [persist],
  )

  const value = useMemo(
    () => ({
      getReflection,
      setReflection,
      savePulse,
    }),
    [getReflection, setReflection, savePulse],
  )

  return (
    <MemoryReflectionContext.Provider value={value}>
      {children}
    </MemoryReflectionContext.Provider>
  )
}

export function useMemoryReflection() {
  const ctx = useContext(MemoryReflectionContext)
  if (!ctx) {
    throw new Error(
      'useMemoryReflection must be used within MemoryReflectionProvider',
    )
  }
  return ctx
}
