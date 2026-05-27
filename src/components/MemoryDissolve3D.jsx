import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FORGET_DURATION_MS } from '../config/memoryForget'

const COUNT = 72

export function MemoryDissolve3D({ anchor, color, startedAt }) {
  const pointsRef = useRef()

  const { geometry, basePositions, velocities } = useMemo(() => {
    const basePositions = new Float32Array(COUNT * 3)
    const velocities = []
    for (let i = 0; i < COUNT; i++) {
      basePositions[i * 3] = (Math.random() - 0.5) * 0.14
      basePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.14
      basePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.14
      velocities.push({
        x: (Math.random() - 0.5) * 0.018,
        y: 0.008 + Math.random() * 0.022,
        z: (Math.random() - 0.5) * 0.018,
      })
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(basePositions.slice(), 3),
    )
    return { geometry, basePositions, velocities }
  }, [])

  useFrame(() => {
    if (!pointsRef.current) return
    const elapsed = Date.now() - startedAt
    const t = Math.min(1, elapsed / FORGET_DURATION_MS)
    const posAttr = geometry.attributes.position

    for (let i = 0; i < COUNT; i++) {
      const v = velocities[i]
      posAttr.array[i * 3] = basePositions[i * 3] + v.x * elapsed * 0.035 * (1 + t)
      posAttr.array[i * 3 + 1] =
        basePositions[i * 3 + 1] + v.y * elapsed * 0.04 + t * 0.12
      posAttr.array[i * 3 + 2] =
        basePositions[i * 3 + 2] + v.z * elapsed * 0.035 - t * 0.06
    }
    posAttr.needsUpdate = true

    const mat = pointsRef.current.material
    mat.opacity = (1 - t) * 0.75
    mat.size = 0.045 * (1 - t * 0.65)
  })

  return (
    <group position={anchor}>
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          color={color}
          size={0.045}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
