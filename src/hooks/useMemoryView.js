import { useCallback, useMemo } from 'react'
import { isLinkedToRegion } from '../data/memories'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useMemoryRegistry } from '../context/MemoryRegistryContext'

/**
 * Single source of truth for the active memory view.
 * Memories surface ONLY when a brain region is selected (region-active state).
 */
export function useMemoryView() {
  const {
    focusedRegion,
    highlightedMemoryId,
    activeMemoryId,
    openMemoryId,
    selectMemory,
    setHighlightedMemoryId,
    setHoveredRegion,
  } = useBrainInteraction()

  const { getArchiveList, findMemoryById, isDissolving, allMemories = [] } =
    useMemoryRegistry()

  const isRegionActive = Boolean(focusedRegion)

  const archive = useMemo(() => {
    if (!focusedRegion) {
      return { primary: [], secondary: [] }
    }
    try {
      return getArchiveList(focusedRegion) ?? { primary: [], secondary: [] }
    } catch (err) {
      console.error('[useMemoryView] getArchiveList failed:', err)
      return { primary: [], secondary: [] }
    }
  }, [getArchiveList, focusedRegion, allMemories])

  const items = useMemo(() => {
    if (!isRegionActive) return []

    const primary = archive.primary ?? []
    const secondary = archive.secondary ?? []
    return [
      ...primary
        .filter((m) => m?.id)
        .map((memory) => ({ memory, tier: 'primary' })),
      ...secondary
        .filter((m) => m?.id)
        .map((memory) => ({ memory, tier: 'secondary' })),
    ]
  }, [archive, isRegionActive])

  const selectedId = openMemoryId ?? activeMemoryId ?? null

  const highlightMemory = useCallback(
    (memoryId) => {
      setHighlightedMemoryId(memoryId)

      if (!memoryId) {
        if (focusedRegion) {
          setHoveredRegion(focusedRegion)
        } else {
          setHoveredRegion(null)
        }
        return
      }

      if (!focusedRegion) return

      const memory = findMemoryById(memoryId)
      if (!memory) return

      if (isLinkedToRegion(memory, focusedRegion)) {
        setHoveredRegion(focusedRegion)
      }
    },
    [
      findMemoryById,
      focusedRegion,
      setHighlightedMemoryId,
      setHoveredRegion,
    ],
  )

  const openMemory = useCallback(
    (memoryId) => {
      if (!memoryId || !focusedRegion) return
      const memory = findMemoryById(memoryId)
      if (!memory || !isLinkedToRegion(memory, focusedRegion)) return
      selectMemory(memoryId)
    },
    [findMemoryById, focusedRegion, selectMemory],
  )

  return useMemo(
    () => ({
      filterRegion: focusedRegion,
      isRegionActive,
      items,
      count: items.length,
      primary: archive.primary ?? [],
      secondary: archive.secondary ?? [],
      highlightedId: highlightedMemoryId,
      selectedId,
      selectMemory: openMemory,
      highlightMemory,
      isDissolving: isDissolving ?? (() => false),
    }),
    [
      focusedRegion,
      isRegionActive,
      items,
      archive.primary,
      archive.secondary,
      highlightedMemoryId,
      selectedId,
      openMemory,
      highlightMemory,
      isDissolving,
    ],
  )
}
