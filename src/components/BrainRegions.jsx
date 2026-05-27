import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { BRAIN_REGIONS } from '../config/brainRegions'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useMemoryRegistry } from '../context/MemoryRegistryContext'

const hoverLocks = { count: 0 }

function RegionZone({ region }) {
  const glowRef = useRef()
  const {
    hoveredRegion,
    focusedRegion,
    setHoveredRegion,
    focusRegion,
  } = useBrainInteraction()
  const { getMemoriesForRegion } = useMemoryRegistry()

  const isHovered = hoveredRegion === region.id
  const isFocused = focusedRegion === region.id
  const isActive = isHovered || isFocused
  const memoryCount = getMemoriesForRegion(region.id).length

  useFrame((state, delta) => {
    if (!glowRef.current) return
    const target = isActive ? (isFocused ? 1 : 0.65) : 0
    glowRef.current.material.opacity +=
      (target * 0.38 - glowRef.current.material.opacity) * delta * 2.5
    const pulse =
      1 + Math.sin(state.clock.elapsedTime * 2) * 0.04 * (isActive ? 1 : 0)
    glowRef.current.scale.set(
      region.scale[0] * 0.85 * pulse,
      region.scale[1] * 0.85 * pulse,
      region.scale[2] * 0.85 * pulse,
    )
  })

  return (
    <group position={region.position}>
      <mesh
        scale={region.scale}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (!focusedRegion) {
            hoverLocks.count += 1
            setHoveredRegion(region.id)
          }
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          hoverLocks.count = Math.max(0, hoverLocks.count - 1)
          if (hoverLocks.count === 0 && !focusedRegion) {
            setHoveredRegion(null)
          }
          document.body.style.cursor = 'default'
        }}
        onClick={(e) => {
          e.stopPropagation()
          focusRegion(region.id)
        }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <mesh
        ref={glowRef}
        scale={[
          region.scale[0] * 0.85,
          region.scale[1] * 0.85,
          region.scale[2] * 0.85,
        ]}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color={region.color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {(isHovered || isFocused) && (
        <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center gap-1 whitespace-nowrap">
            <span className="font-display text-lg font-light italic tracking-wide text-violet-100/85">
              {region.label}
            </span>
            <span className="font-body text-[10px] font-light tracking-[0.2em] text-violet-300/45 uppercase">
              {isFocused ? 'fragments surfacing' : region.hint}
            </span>
            {memoryCount > 0 && (
              <span className="font-body text-[9px] text-violet-400/30">
                {isFocused
                  ? `${memoryCount} ${memoryCount === 1 ? 'memory' : 'memories'}`
                  : `click · ${memoryCount}`}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

export function BrainRegions({ regions = BRAIN_REGIONS }) {
  return (
    <group>
      {regions.map((region) => (
        <RegionZone key={region.id} region={region} />
      ))}
    </group>
  )
}
