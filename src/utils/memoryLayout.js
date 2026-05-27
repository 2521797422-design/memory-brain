import * as THREE from 'three'
import {
  isPrimaryInRegion,
  isSecondaryInRegion,
} from '../data/memories'

function hashId(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function isValidPosition(position) {
  return (
    Array.isArray(position) &&
    position.length === 3 &&
    position.every((n) => typeof n === 'number' && Number.isFinite(n))
  )
}

/**
 * World center for a region — uses scaled position when brain is ready,
 * otherwise derives from normalized coords on a default unit volume.
 */
export function getRegionWorldPosition(regionConfig, bounds = null) {
  if (!regionConfig) return new THREE.Vector3(0, 0, 0)

  if (isValidPosition(regionConfig.position)) {
    return new THREE.Vector3(...regionConfig.position)
  }

  const [fx, fy, fz] = regionConfig.normalized ?? [0.5, 0.5, 0.5]
  const size = bounds
    ? bounds.getSize(new THREE.Vector3())
    : new THREE.Vector3(2.2, 2.2, 2.2)
  const center = bounds
    ? bounds.getCenter(new THREE.Vector3())
    : new THREE.Vector3(0, 0, 0)

  return new THREE.Vector3(
    center.x + (fx - 0.5) * size.x,
    center.y + (fy - 0.5) * size.y,
    center.z + (fz - 0.5) * size.z,
  )
}

/**
 * Gentle cluster around a brain region center — deterministic per memory id.
 */
export function computeClusterAnchor(
  memory,
  regionConfig,
  index,
  total,
  filterRegion,
  bounds = null,
) {
  const center = getRegionWorldPosition(regionConfig, bounds)
  const h = hashId(memory.id)

  const isEcho =
    filterRegion &&
    isSecondaryInRegion(memory, filterRegion) &&
    !isPrimaryInRegion(memory, filterRegion)

  const golden = index * 2.399963 + (h % 97) * 0.01
  const ring = isEcho ? 0.32 : 0.2
  const radius = ring + (index % 3) * 0.04 + ((h % 40) / 40) * 0.04
  const yWave = Math.sin(golden * 0.8) * 0.07 + ((h >> 4) % 20) * 0.002 - 0.04

  return center.clone().add(
    new THREE.Vector3(
      Math.cos(golden) * radius,
      yWave,
      Math.sin(golden) * radius * 0.82,
    ),
  )
}

function isValidAnchor(anchor) {
  return (
    anchor &&
    Number.isFinite(anchor.x) &&
    Number.isFinite(anchor.y) &&
    Number.isFinite(anchor.z)
  )
}

/**
 * Map the unified view items to 3D placements (one anchor per memory).
 */
export function layoutFloatingMemories(
  viewItems,
  regions,
  filterRegion,
  bounds = null,
) {
  if (!filterRegion) return []
  if (!Array.isArray(regions) || regions.length === 0) return []
  if (!Array.isArray(viewItems) || viewItems.length === 0) return []

  const config = regions.find((r) => r?.id === filterRegion)
  if (!config) return []

  const safeItems = viewItems.filter(
    (entry) => entry?.memory?.id && entry.memory.primaryRegion,
  )

  return safeItems
    .map((entry, index) => {
      const anchor = computeClusterAnchor(
        entry.memory,
        config,
        index,
        safeItems.length,
        filterRegion,
        bounds,
      )
      if (!isValidAnchor(anchor)) return null
      return {
        ...entry,
        anchor,
        regionColor: config.color ?? '#d4c8e8',
        layoutRegionId: filterRegion,
      }
    })
    .filter(Boolean)
}

export function driftOffset(memoryId, time, amplitude = 0.12) {
  const h = hashId(memoryId)
  const phase = h * 0.017
  return {
    x: Math.sin(time * 0.3 + phase) * amplitude,
    y: Math.cos(time * 0.24 + phase * 1.3) * amplitude,
    z: Math.sin(time * 0.2 + phase * 0.7) * amplitude * 0.7,
  }
}
