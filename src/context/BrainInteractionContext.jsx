import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as THREE from 'three'
import { isLinkedToRegion } from '../data/memories'
import { useBrainModel } from './BrainModelContext'
import { useMemoryRegistry } from './MemoryRegistryContext'

const BrainInteractionContext = createContext(null)

export function BrainInteractionProvider({ children }) {
  const [hoveredRegion, setHoveredRegion] = useState(null)
  const [focusedRegion, setFocusedRegion] = useState(null)
  const [activeMemoryId, setActiveMemoryId] = useState(null)
  const [openMemoryId, setOpenMemoryId] = useState(null)
  const [highlightedMemoryId, setHighlightedMemoryId] = useState(null)
  const { regions } = useBrainModel()
  const { findMemoryById } = useMemoryRegistry()

  const activeRegion = focusedRegion ?? hoveredRegion

  const activeConfig = useMemo(
    () => regions.find((r) => r.id === activeRegion) ?? null,
    [activeRegion, regions],
  )

  const focusedConfig = useMemo(
    () => regions.find((r) => r.id === focusedRegion) ?? null,
    [focusedRegion, regions],
  )

  const activeCenter = useMemo(() => {
    if (!activeConfig?.position) return null
    return new THREE.Vector3(...activeConfig.position)
  }, [activeConfig])

  const focusCenter = useMemo(() => {
    if (!focusedConfig?.position) return null
    return new THREE.Vector3(...focusedConfig.position)
  }, [focusedConfig])

  const openMemory = useMemo(() => {
    if (!openMemoryId) return null
    return findMemoryById(openMemoryId)
  }, [openMemoryId, findMemoryById])

  const activeMemory = useMemo(() => {
    if (!activeMemoryId) return null
    return findMemoryById(activeMemoryId)
  }, [activeMemoryId, findMemoryById])

  const resolveFocusRegion = useCallback((memory, filterRegion) => {
    if (filterRegion && isLinkedToRegion(memory, filterRegion)) {
      return filterRegion
    }
    return memory.primaryRegion
  }, [])

  const selectRegion = useCallback((regionId) => {
    setFocusedRegion(regionId)
    setActiveMemoryId(null)
    setOpenMemoryId(null)
    setHighlightedMemoryId(null)
  }, [])

  const focusRegion = useCallback((regionId) => {
    setFocusedRegion((prev) => {
      if (prev === regionId) {
        setActiveMemoryId(null)
        setOpenMemoryId(null)
        setHighlightedMemoryId(null)
        return null
      }
      setActiveMemoryId(null)
      setOpenMemoryId(null)
      setHighlightedMemoryId(null)
      return regionId
    })
  }, [])

  const clearFocus = useCallback(() => {
    setFocusedRegion(null)
    setActiveMemoryId(null)
    setOpenMemoryId(null)
    setHighlightedMemoryId(null)
  }, [])

  const selectMemory = useCallback(
    (memoryId) => {
      const memory = findMemoryById(memoryId)
      if (!memory) return

      if (focusedRegion) {
        if (!isLinkedToRegion(memory, focusedRegion)) return
      } else {
        setFocusedRegion(resolveFocusRegion(memory, null))
      }

      setActiveMemoryId(memoryId)
      setHighlightedMemoryId(memoryId)
      setOpenMemoryId(memoryId)
    },
    [focusedRegion, resolveFocusRegion, findMemoryById],
  )

  const openMemoryFragment = useCallback(
    (memoryId) => {
      const memory = findMemoryById(memoryId)
      if (!memory) return
      const region = resolveFocusRegion(memory, focusedRegion)
      setFocusedRegion(region)
      setActiveMemoryId(memoryId)
      setOpenMemoryId(memoryId)
    },
    [focusedRegion, resolveFocusRegion, findMemoryById],
  )

  const closeMemory = useCallback(() => {
    setOpenMemoryId(null)
    setActiveMemoryId(null)
  }, [])

  const clearIfMemory = useCallback((memoryId) => {
    setActiveMemoryId((id) => (id === memoryId ? null : id))
    setOpenMemoryId((id) => (id === memoryId ? null : id))
    setHighlightedMemoryId((id) => (id === memoryId ? null : id))
  }, [])

  useEffect(() => {
    const onForgotten = (e) => {
      clearIfMemory(e.detail.memoryId)
    }
    window.addEventListener('memory-forgotten', onForgotten)
    return () => window.removeEventListener('memory-forgotten', onForgotten)
  }, [clearIfMemory])

  const value = useMemo(
    () => ({
      hoveredRegion,
      setHoveredRegion,
      focusedRegion,
      focusRegion,
      selectRegion,
      clearFocus,
      isFocused: Boolean(focusedRegion),
      activeRegion,
      activeConfig,
      focusedConfig,
      activeCenter,
      focusCenter,
      activeMemoryId,
      activeMemory,
      openMemory,
      openMemoryId,
      selectMemory,
      openMemoryFragment,
      closeMemory,
      clearIfMemory,
      highlightedMemoryId,
      setHighlightedMemoryId,
      regions,
      setActiveRegion: setHoveredRegion,
      clearRegion: () => setHoveredRegion(null),
    }),
    [
      hoveredRegion,
      focusedRegion,
      focusRegion,
      selectRegion,
      clearFocus,
      activeRegion,
      activeConfig,
      focusedConfig,
      activeCenter,
      focusCenter,
      activeMemoryId,
      activeMemory,
      openMemory,
      openMemoryId,
      selectMemory,
      openMemoryFragment,
      closeMemory,
      clearIfMemory,
      highlightedMemoryId,
      regions,
    ],
  )

  return (
    <BrainInteractionContext.Provider value={value}>
      {children}
    </BrainInteractionContext.Provider>
  )
}

export function useBrainInteraction() {
  const ctx = useContext(BrainInteractionContext)
  if (!ctx) {
    throw new Error('useBrainInteraction must be used within BrainInteractionProvider')
  }
  return ctx
}
