import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useBrainModel } from '../context/BrainModelContext'
import { useMemoryRegistry } from '../context/MemoryRegistryContext'
import { useMemoryView } from '../hooks/useMemoryView'
import { driftOffset, layoutFloatingMemories } from '../utils/memoryLayout'
import { MemoryDissolve3D } from './MemoryDissolve3D'
import { ForgetMemoryButton } from './ForgetMemoryButton'
import { MemoryMediaThumb } from './MemoryMediaThumb'

const TYPE_GLOW = {
  image: '#d8cce8',
  video: '#c8d8f0',
  text: '#e8dce8',
}

function FloatingMemoryCard({
  memory,
  visible,
  isHighlighted,
  isSelected,
  dissolving,
  onSelect,
  onHighlight,
}) {
  if (!visible || !memory) return null

  const emphasis = isSelected || isHighlighted

  return (
    <Html center distanceFactor={7} style={{ pointerEvents: 'auto' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onSelect(memory.id)
        }}
        onMouseEnter={() => onHighlight(memory.id)}
        onMouseLeave={() => onHighlight(null)}
        aria-label={`Open memory: ${memory.title}`}
        className={`flex cursor-pointer flex-col items-center border-0 bg-transparent p-0 transition-all duration-700 ease-out focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-200/40 ${
          dissolving
            ? 'memory-dissolving scale-90 opacity-0'
            : emphasis
              ? 'scale-105 opacity-95'
              : 'scale-100 opacity-50 hover:opacity-70'
        }`}
      >
        <div
          className={`relative h-[52px] w-[40px] overflow-hidden rounded-sm border backdrop-blur-sm transition-all duration-700 sm:h-[58px] sm:w-[44px] ${
            isSelected
              ? 'border-violet-200/35 shadow-[0_0_28px_rgba(200,180,220,0.25)]'
              : isHighlighted
                ? 'border-violet-200/25 shadow-[0_0_20px_rgba(180,160,200,0.15)]'
                : 'border-violet-200/12 shadow-[0_0_16px_rgba(160,140,180,0.08)]'
          }`}
        >
          <MemoryMediaThumb
            memory={memory}
            textClassName="font-display text-[8px] font-light italic text-violet-100/45"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#03020a]/70 via-transparent to-transparent" />
        </div>

        <p className="font-display pointer-events-none mt-1.5 max-w-[64px] truncate text-center text-[9px] font-light italic text-violet-50/65">
          {memory.title}
        </p>
      </button>
    </Html>
  )
}

function FloatingFragment({
  memory,
  anchor,
  regionColor,
  tier,
  isHighlighted,
  isSelected,
  dissolving,
  dissolveStartedAt,
  onSelect,
  onForget,
  onHighlight,
}) {
  const groupRef = useRef()
  const coreRef = useRef()
  const haloRef = useRef()
  const hitRef = useRef()
  const [hovered, setHovered] = useState(false)
  const { openMemoryId } = useBrainInteraction()

  if (!memory?.id || !anchor) return null

  const isOpen = openMemoryId === memory.id
  const glowColor = TYPE_GLOW[memory.mediaType] ?? regionColor ?? '#d8cce8'
  const isEcho = tier === 'secondary'
  const emphasis = isSelected || isHighlighted || hovered

  const handleSelect = (e) => {
    e.stopPropagation()
    onHighlight(memory.id)
    onSelect(memory.id)
  }

  useFrame((state, delta) => {
    if (!groupRef.current || !anchor) return
    const t = state.clock.elapsedTime
    const drift = dissolving ? 0.02 : isOpen ? 0.05 : isEcho ? 0.08 : 0.1
    const off = driftOffset(memory.id, t, drift)

    groupRef.current.position.set(
      anchor.x + off.x,
      anchor.y + off.y,
      anchor.z + off.z,
    )

    const target = dissolving ? 0.5 : isOpen ? 0.9 : emphasis ? 1.12 : isEcho ? 0.86 : 1
    const opacity = dissolving
      ? 0.04
      : isOpen
        ? 0.2
        : emphasis
          ? 0.45
          : isEcho
            ? 0.18
            : 0.28

    if (coreRef.current?.material) {
      const s = coreRef.current.scale.x
      coreRef.current.scale.setScalar(s + (target - s) * delta * 4)
      coreRef.current.material.opacity +=
        (opacity - coreRef.current.material.opacity) * delta * 5
    }
    if (haloRef.current?.material) {
      const haloTarget = dissolving ? 0.01 : emphasis ? 0.11 : isEcho ? 0.035 : 0.05
      haloRef.current.material.opacity +=
        (haloTarget - haloRef.current.material.opacity) * delta * 4
    }
  })

  return (
    <group ref={groupRef}>
      {dissolving && dissolveStartedAt && (
        <MemoryDissolve3D
          anchor={[0, 0, 0]}
          color={regionColor ?? '#d4c8e8'}
          startedAt={dissolveStartedAt}
        />
      )}

      <mesh ref={haloRef} scale={emphasis ? 2 : 1.65}>
        <sphereGeometry args={[0.07, 18, 18]} />
        <meshBasicMaterial
          color={regionColor ?? '#d4c8e8'}
          transparent
          opacity={0.05}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {!dissolving && (
        <>
          <mesh
            ref={hitRef}
            scale={1.35}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHovered(true)
              onHighlight(memory.id)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              setHovered(false)
              document.body.style.cursor = 'default'
            }}
            onClick={handleSelect}
          >
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          <mesh ref={coreRef}>
            <sphereGeometry args={[0.06, 20, 20]} />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.28}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}

      <FloatingMemoryCard
        memory={memory}
        visible={!isOpen && !dissolving}
        isHighlighted={isHighlighted || hovered}
        isSelected={isSelected}
        dissolving={dissolving}
        onSelect={onSelect}
        onHighlight={onHighlight}
      />

      {!dissolving && (hovered || isHighlighted) && (
        <Html position={[0, 0.22, 0]} center distanceFactor={8}>
          <div className="pointer-events-auto">
            <ForgetMemoryButton
              className="relative opacity-100"
              onForget={(e) => onForget(e, memory)}
            />
          </div>
        </Html>
      )}
    </group>
  )
}

export function MemoryNodes() {
  const { regions, bounds } = useBrainModel()
  const { clearIfMemory } = useBrainInteraction()
  const { forgetMemory, dissolveEffects = [] } = useMemoryRegistry()
  const {
    items = [],
    filterRegion,
    isRegionActive,
    highlightedId,
    selectedId,
    highlightMemory,
    selectMemory,
    isDissolving,
  } = useMemoryView()

  const placements = useMemo(() => {
    if (!isRegionActive || !filterRegion) return []
    return layoutFloatingMemories(items, regions, filterRegion, bounds)
  }, [items, regions, filterRegion, bounds, isRegionActive])

  const handleForget = (e, memory, anchor) => {
    if (!memory?.id || !anchor) return
    e.stopPropagation()
    forgetMemory(memory.id, {
      screenX: window.innerWidth / 2,
      screenY: window.innerHeight * 0.42,
      width: 120,
      height: 140,
      worldAnchor: anchor.clone(),
    })
    clearIfMemory(memory.id)
  }

  if (!isRegionActive || !filterRegion) {
    return null
  }

  const orphanDissolves = (dissolveEffects ?? []).filter((e) => e?.worldAnchor)

  if (!placements.length && !orphanDissolves.length) {
    return null
  }

  return (
    <>
      {placements.map((placement) => {
        if (!placement?.memory?.id || !placement.anchor) return null

        const { memory, anchor, regionColor, tier } = placement
        const dissolving = isDissolving(memory.id)
        const effect = dissolveEffects.find((d) => d.id === memory.id)

        return (
          <FloatingFragment
            key={memory.id}
            memory={memory}
            anchor={anchor}
            regionColor={regionColor}
            tier={tier}
            isHighlighted={highlightedId === memory.id}
            isSelected={selectedId === memory.id}
            dissolving={dissolving}
            dissolveStartedAt={effect?.startedAt}
            onSelect={selectMemory}
            onHighlight={highlightMemory}
            onForget={(e, m) => handleForget(e, m, anchor)}
          />
        )
      })}

      {orphanDissolves.map((effect) => {
        if (!effect?.id || !effect.worldAnchor) return null
        if (placements.some((p) => p.memory.id === effect.id)) return null

        const pos = effect.worldAnchor
        const position = pos instanceof THREE.Vector3
          ? [pos.x, pos.y, pos.z]
          : Array.isArray(pos)
            ? pos
            : null
        if (!position) return null

        const color =
          regions?.find((r) => r.id === filterRegion)?.color ?? '#d4c8e8'

        return (
          <group key={effect.id} position={position}>
            <MemoryDissolve3D
              anchor={[0, 0, 0]}
              color={color}
              startedAt={effect.startedAt ?? Date.now()}
            />
          </group>
        )
      })}
    </>
  )
}
