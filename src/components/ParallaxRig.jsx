import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useMouseParallax } from '../hooks/useMouseParallax'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useBrainRotation } from '../context/BrainRotationContext'

export function ParallaxRig({ children }) {
  const groupRef = useRef()
  const lerpMouse = useMouseParallax()
  const { camera } = useThree()
  const { state } = useBrainRotation()
  const { isFocused } = useBrainInteraction()

  useFrame(() => {
    if (isFocused) {
      if (groupRef.current) {
        groupRef.current.position.x *= 0.92
        groupRef.current.position.y *= 0.92
      }
      return
    }

    const s = state.current
    const interacting =
      s.dragging || Math.abs(s.yawVel) > 0.001 || Math.abs(s.pitchVel) > 0.001

    const { x, y } = lerpMouse(0.032)
    const parallax = interacting ? 0.42 : 0.55

    if (groupRef.current) {
      const tx = x * 0.1 * parallax
      const ty = y * 0.08 * parallax
      groupRef.current.position.x += (tx - groupRef.current.position.x) * 0.035
      groupRef.current.position.y += (ty - groupRef.current.position.y) * 0.035
    }

    if (!isFocused) {
      const camX = x * 0.28 * parallax
      const camY = y * 0.16 * parallax
      camera.position.x += (camX - camera.position.x) * 0.02
      camera.position.y += (camY - camera.position.y) * 0.02
      camera.lookAt(0, 0, 0)
    }
  })

  return <group ref={groupRef}>{children}</group>
}
