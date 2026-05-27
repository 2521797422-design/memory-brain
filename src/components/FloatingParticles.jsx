import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useBrainModel } from '../context/BrainModelContext'
import { useImmersiveVideo } from '../hooks/useImmersiveVideo'

const COUNT = 1400

export function FloatingParticles() {
  const ref = useRef()
  const { activeCenter, activeRegion } = useBrainInteraction()
  const { radius, ready } = useBrainModel()
  const immersiveVideo = useImmersiveVideo()

  const orbit = useMemo(() => {
    const inner = radius * 1.12
    const outer = radius * 2.35
    const radii = new Float32Array(COUNT)
    const thetas = new Float32Array(COUNT)
    const phis = new Float32Array(COUNT)
    const speeds = new Float32Array(COUNT)
    const drift = new Float32Array(COUNT)
    const phases = new Float32Array(COUNT)
    const sizes = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      radii[i] = inner + Math.random() * (outer - inner)
      thetas[i] = Math.random() * Math.PI * 2
      phis[i] = Math.acos(2 * Math.random() - 1)
      speeds[i] = 0.04 + Math.random() * 0.12
      drift[i] = 0.08 + Math.random() * 0.15
      phases[i] = Math.random() * Math.PI * 2
      sizes[i] = 0.02 + Math.random() * 0.03
    }

    return { radii, thetas, phis, speeds, drift, phases, sizes, inner, outer }
  }, [radius])

  const positions = useMemo(() => new Float32Array(COUNT * 3), [])

  useFrame((state) => {
    if (!ref.current) return
    const mat = ref.current.material

    if (immersiveVideo) {
      mat.opacity = 0.2
      mat.size = 0.024
      mat.color.set('#b8a8bc')
      return
    }

    const t = state.clock.elapsedTime
    const pos = ref.current.geometry.attributes.position.array
    const center = activeCenter ?? new THREE.Vector3(0, 0, 0)
    const orbitBoost = ready ? 1 : 0.85

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      orbit.thetas[i] += orbit.speeds[i] * 0.008 * orbitBoost

      const r =
        orbit.radii[i] +
        Math.sin(t * orbit.drift[i] + orbit.phases[i]) * 0.12
      const theta = orbit.thetas[i]
      const phi = orbit.phis[i] + Math.sin(t * 0.2 + orbit.phases[i]) * 0.08

      pos[i3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] =
        r * Math.sin(phi) * Math.sin(theta) +
        Math.sin(t * 0.35 + orbit.phases[i]) * 0.06
      pos[i3 + 2] = r * Math.cos(phi)

      if (activeRegion) {
        const dx = pos[i3] - center.x
        const dy = pos[i3 + 1] - center.y
        const dz = pos[i3 + 2] - center.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < radius * 1.1) {
          const glow = (radius * 1.1 - dist) / (radius * 1.1)
          pos[i3] -= dx * glow * 0.018
          pos[i3 + 1] -= dy * glow * 0.018
          pos[i3 + 2] -= dz * glow * 0.018
        }
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true
    mat.opacity = 0.38 + (activeRegion ? 0.14 : 0) + Math.sin(t * 0.3) * 0.04
    mat.size = activeRegion ? 0.038 : 0.03
    mat.color.set(activeRegion ? '#f2e4f0' : '#c4b0c8')
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#c4b0c8"
        transparent
        opacity={0.42}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
