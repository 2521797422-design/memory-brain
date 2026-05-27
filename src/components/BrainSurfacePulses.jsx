import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useImmersiveVideo } from '../hooks/useImmersiveVideo'

const PULSE_COUNT = 120

export function BrainSurfacePulses({ surfacePoints }) {
  const ref = useRef()
  const { activeCenter, activeRegion } = useBrainInteraction()
  const immersiveVideo = useImmersiveVideo()

  const { offsets, speeds, phases } = useMemo(() => {
    const offsets = new Float32Array(PULSE_COUNT * 3)
    const speeds = new Float32Array(PULSE_COUNT)
    const phases = new Float32Array(PULSE_COUNT)

    for (let i = 0; i < PULSE_COUNT; i++) {
      const p = surfacePoints[i % surfacePoints.length]
      offsets[i * 3] = p.x
      offsets[i * 3 + 1] = p.y
      offsets[i * 3 + 2] = p.z
      speeds[i] = 0.4 + Math.random() * 0.8
      phases[i] = Math.random() * Math.PI * 2
    }
    return { offsets, speeds, phases }
  }, [surfacePoints])

  const positions = useMemo(() => {
    const arr = new Float32Array(PULSE_COUNT * 3)
    arr.set(offsets)
    return arr
  }, [offsets])

  useFrame((state) => {
    if (!ref.current) return

    if (immersiveVideo) {
      const mat = ref.current.material
      mat.opacity = 0.18
      mat.size = 0.04
      return
    }

    const t = state.clock.elapsedTime
    const boost = activeRegion ? 1.8 : 1
    const center = activeCenter ?? new THREE.Vector3()

    for (let i = 0; i < PULSE_COUNT; i++) {
      const i3 = i * 3
      const base = surfacePoints[i % surfacePoints.length]
      const n = base.clone().normalize()
      const travel = Math.sin(t * speeds[i] + phases[i]) * 0.06 * boost
      const along = Math.cos(t * speeds[i] * 0.7 + phases[i]) * 0.04

      positions[i3] = base.x + n.x * travel + n.z * along * 0.3
      positions[i3 + 1] = base.y + n.y * travel
      positions[i3 + 2] = base.z + n.z * travel + n.x * along * 0.3

      if (activeRegion) {
        const dx = positions[i3] - center.x
        const dy = positions[i3 + 1] - center.y
        const dz = positions[i3 + 2] - center.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < 0.55) {
          const pull = (0.55 - dist) * 0.015
          positions[i3] += dx * pull
          positions[i3 + 1] += dy * pull
          positions[i3 + 2] += dz * pull
        }
      }
    }

    ref.current.geometry.attributes.position.array = positions
    ref.current.geometry.attributes.position.needsUpdate = true

    const mat = ref.current.material
    mat.opacity = 0.35 + (activeRegion ? 0.25 : 0) + Math.sin(t * 0.8) * 0.08
    mat.size = activeRegion ? 0.09 : 0.055
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PULSE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#f0dce8"
        transparent
        opacity={0.32}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
