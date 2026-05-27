import { useEffect, useRef } from 'react'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useUiAudio } from '../context/UiAudioContext'

/**
 * Custom sample: region/nav clicks, memory opens, memory hovers.
 * All audio unlocks on the user's first interaction (see AmbientAudioContext).
 */
export function BrainInteractionSoundBridge() {
  const { focusedRegion, highlightedMemoryId, openMemoryId } =
    useBrainInteraction()
  const { playInteraction, playMemoryHover, playMemoryOpen } = useUiAudio()

  const prevFocusRef = useRef(focusedRegion)
  const prevHighlightRef = useRef(highlightedMemoryId)
  const prevOpenRef = useRef(openMemoryId)

  useEffect(() => {
    const prev = prevFocusRef.current
    if (focusedRegion && focusedRegion !== prev) {
      playInteraction()
    }
    prevFocusRef.current = focusedRegion
  }, [focusedRegion, playInteraction])

  useEffect(() => {
    const prev = prevOpenRef.current
    if (openMemoryId && openMemoryId !== prev) {
      playMemoryOpen()
    }
    prevOpenRef.current = openMemoryId
  }, [openMemoryId, playMemoryOpen])

  useEffect(() => {
    const prev = prevHighlightRef.current
    prevHighlightRef.current = highlightedMemoryId

    if (!highlightedMemoryId || highlightedMemoryId === prev) return
    if (openMemoryId === highlightedMemoryId) return

    playMemoryHover(highlightedMemoryId)
  }, [highlightedMemoryId, openMemoryId, playMemoryHover])

  return null
}
