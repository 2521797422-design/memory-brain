import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { useBrainInteraction } from '../context/BrainInteractionContext'

export function PointerReset() {
  const { gl } = useThree()
  const { setHoveredRegion, isFocused } = useBrainInteraction()

  useEffect(() => {
    const canvas = gl.domElement
    const onLeave = () => {
      if (!isFocused) setHoveredRegion(null)
    }
    canvas.addEventListener('pointerleave', onLeave)
    return () => canvas.removeEventListener('pointerleave', onLeave)
  }, [gl, setHoveredRegion, isFocused])

  return null
}
