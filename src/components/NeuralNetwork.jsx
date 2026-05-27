import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useBrainModel } from '../context/BrainModelContext'
import { useImmersiveVideo } from '../hooks/useImmersiveVideo'

const NODE_COUNT = 52

function buildNetwork(radius) {
  const nodes = []
  const shell = radius * 1.15

  for (let i = 0; i < NODE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const wobble = 0.88 + Math.random() * 0.22
    nodes.push(
      new THREE.Vector3(
        shell * wobble * Math.sin(phi) * Math.cos(theta),
        shell * wobble * Math.sin(phi) * Math.sin(theta) * 0.9,
        shell * wobble * Math.cos(phi),
      ),
    )
  }

  const segments = []
  for (let i = 0; i < nodes.length; i++) {
    const distances = nodes
      .map((n, j) => ({ j, d: nodes[i].distanceTo(n) }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)

    for (const { j } of distances) {
      if (j > i) segments.push(nodes[i], nodes[j])
    }
  }

  const positions = new Float32Array(segments.length * 3)
  segments.forEach((v, i) => {
    positions[i * 3] = v.x
    positions[i * 3 + 1] = v.y
    positions[i * 3 + 2] = v.z
  })

  return { positions, nodePositions: nodes }
}

export function NeuralNetwork() {
  const lineRef = useRef()
  const nodesRef = useRef()
  const extraRef = useRef()
  const { activeCenter, activeRegion } = useBrainInteraction()
  const { radius } = useBrainModel()
  const immersiveVideo = useImmersiveVideo()

  const { positions, nodePositions } = useMemo(
    () => buildNetwork(radius),
    [radius],
  )

  const baseNodeArray = useMemo(() => {
    const arr = new Float32Array(nodePositions.length * 3)
    nodePositions.forEach((v, i) => {
      arr[i * 3] = v.x
      arr[i * 3 + 1] = v.y
      arr[i * 3 + 2] = v.z
    })
    return arr
  }, [nodePositions])

  const extraLines = useMemo(() => {
    if (!activeRegion || !activeCenter) return null
    const pts = []
    for (let i = 0; i < 10; i++) {
      const n = nodePositions[i % nodePositions.length]
      if (n.distanceTo(activeCenter) < radius * 0.85) {
        pts.push(
          n,
          activeCenter.clone().add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.15,
              (Math.random() - 0.5) * 0.15,
              (Math.random() - 0.5) * 0.15,
            ),
          ),
        )
      }
    }
    return pts.length ? new Float32Array(pts.flatMap((v) => [v.x, v.y, v.z])) : null
  }, [nodePositions, activeCenter, activeRegion, radius])

  useFrame((state, delta) => {
    if (immersiveVideo) {
      if (lineRef.current) lineRef.current.material.opacity = 0.1
      if (nodesRef.current) {
        nodesRef.current.material.opacity = 0.14
        nodesRef.current.material.size = 0.04
      }
      if (extraRef.current) extraRef.current.material.opacity = 0.06
      return
    }

    const t = state.clock.elapsedTime
    const boost = activeRegion ? 1.5 : 1
    const pulse = (0.18 + Math.sin(t * 0.45 * boost) * 0.06) * (activeRegion ? 1.25 : 1)

    if (lineRef.current) lineRef.current.material.opacity = pulse
    if (nodesRef.current) {
      nodesRef.current.material.opacity =
        0.28 + Math.sin(t * 0.6 * boost) * 0.1 + (activeRegion ? 0.15 : 0)
      nodesRef.current.material.size = activeRegion ? 0.07 : 0.05
    }
    if (extraRef.current && activeRegion) {
      extraRef.current.material.opacity = 0.12 + Math.sin(t * 2.5) * 0.08
    }

    if (nodesRef.current) {
      const arr = nodesRef.current.geometry.attributes.position.array
      for (let i = 0; i < nodePositions.length; i++) {
        const i3 = i * 3
        arr[i3] = baseNodeArray[i3]
        arr[i3 + 1] = baseNodeArray[i3 + 1]
        arr[i3 + 2] = baseNodeArray[i3 + 2]

        if (activeCenter && activeRegion) {
          const dx = arr[i3] - activeCenter.x
          const dy = arr[i3 + 1] - activeCenter.y
          const dz = arr[i3 + 2] - activeCenter.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist < radius * 0.7) {
            const pull = (radius * 0.7 - dist) * 0.005 * delta * 60
            arr[i3] -= dx * pull
            arr[i3 + 1] -= dy * pull
            arr[i3 + 2] -= dz * pull
          }
        }
      }
      nodesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#a898b8"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </line>

      {activeRegion && extraLines && extraLines.length > 0 && (
        <line ref={extraRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={extraLines.length / 3}
              array={extraLines}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#e8dce8"
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>
      )}

      <points ref={nodesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={nodePositions.length}
            array={baseNodeArray}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#d8c8d8"
          transparent
          opacity={0.32}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
