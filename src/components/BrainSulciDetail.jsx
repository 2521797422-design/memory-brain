import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { extractSulciLines } from '../utils/brainGeometry'
import { useBrainInteraction } from '../context/BrainInteractionContext'

export function BrainSulciDetail({ geometry }) {
  const ref = useRef()
  const { activeRegion } = useBrainInteraction()
  const positions = useMemo(
    () => extractSulciLines(geometry, 110),
    [geometry],
  )

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.material.opacity =
      0.12 + Math.sin(t * 0.4) * 0.04 + (activeRegion ? 0.08 : 0)
  })

  if (!positions.length) return null

  return (
    <line ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#9a7faa"
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </line>
  )
}
