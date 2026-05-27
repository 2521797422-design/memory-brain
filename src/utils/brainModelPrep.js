import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import {
  BRAIN_ORIENTATION_OFFSET,
  getBrainTargetSize,
} from '../config/brainModel'

const _v = new THREE.Vector3()
const _q = new THREE.Quaternion()

function collectVertices(scene) {
  const points = []
  scene.updateMatrixWorld(true, true)
  scene.traverse((child) => {
    if (!child.isMesh?.geometry?.attributes?.position) return
    const pos = child.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i)
      _v.applyMatrix4(child.matrixWorld)
      points.push(_v.clone())
    }
  })
  return points
}

/** Narrowest pole ≈ brainstem (inferior). */
function poleNarrowness(points, axis, towardMin) {
  const coords = points.map((p) => p.getComponent(axis))
  const min = Math.min(...coords)
  const max = Math.max(...coords)
  const span = max - min || 1
  const slice = span * 0.14

  const pole = points.filter((p) => {
    const c = p.getComponent(axis)
    return towardMin ? c <= min + slice : c >= max - slice
  })
  if (pole.length < 8) return Infinity

  const axes = [0, 1, 2].filter((a) => a !== axis)
  let spread = 0
  for (const a of axes) {
    const vals = pole.map((p) => p.getComponent(a))
    const mean = vals.reduce((s, n) => s + n, 0) / vals.length
    const variance =
      vals.reduce((s, n) => s + (n - mean) ** 2, 0) / vals.length
    spread += Math.sqrt(variance)
  }
  return spread
}

function findInferiorUp(points) {
  let bestAxis = 1
  let bestSign = -1
  let bestSpread = Infinity

  for (let axis = 0; axis < 3; axis++) {
    for (const towardMin of [true, false]) {
      const spread = poleNarrowness(points, axis, towardMin)
      if (spread < bestSpread) {
        bestSpread = spread
        bestAxis = axis
        bestSign = towardMin ? -1 : 1
      }
    }
  }

  const up = new THREE.Vector3()
  up.setComponent(bestAxis, bestSign)
  return up.normalize()
}

function findAnteriorForward(points, up) {
  const working = points.map((p) => p.clone())
  _q.setFromUnitVectors(up, new THREE.Vector3(0, 1, 0))
  working.forEach((p) => p.applyQuaternion(_q))

  const ys = working.map((p) => p.y)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const ySpan = maxY - minY || 1

  const zs = working.map((p) => p.z)
  const minZ = Math.min(...zs)
  const maxZ = Math.max(...zs)
  const zSpan = maxZ - minZ || 1

  const posterior = working.filter((p) => p.z <= minZ + zSpan * 0.28)
  const anterior = working.filter((p) => p.z >= maxZ - zSpan * 0.28)
  const inferior = working.filter((p) => p.y <= minY + ySpan * 0.22)

  const centroid = (arr) => {
    if (!arr.length) return new THREE.Vector3()
    const c = new THREE.Vector3()
    arr.forEach((p) => c.add(p))
    return c.multiplyScalar(1 / arr.length)
  }

  const postC = centroid(posterior)
  const antC = centroid(anterior)
  const infC = centroid(inferior)

  const forward = antC.clone().sub(postC)
  if (forward.lengthSq() < 1e-6) {
    forward.set(0, 0, 1)
  }

  const cerebellumHint = postC.clone().add(infC).multiplyScalar(0.5)
  forward.add(cerebellumHint.sub(antC).multiplyScalar(0.15))

  forward.y = 0
  if (forward.lengthSq() < 1e-6) forward.set(0, 0, 1)
  forward.normalize()

  forward.applyQuaternion(_q.clone().invert())
  return forward
}

function computeAnatomicalQuaternion(points) {
  const up = findInferiorUp(points)
  const forward = findAnteriorForward(points, up)

  const yUp = new THREE.Vector3(0, 1, 0)
  const zFwd = new THREE.Vector3(0, 0, 1)

  const qAlignUp = new THREE.Quaternion().setFromUnitVectors(up, yUp)

  const fAligned = forward.clone().applyQuaternion(qAlignUp)
  fAligned.y = 0
  if (fAligned.lengthSq() < 1e-6) fAligned.set(0, 0, 1)
  fAligned.normalize()

  const qAlignFwd = new THREE.Quaternion().setFromUnitVectors(fAligned, zFwd)

  const qOffset = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      BRAIN_ORIENTATION_OFFSET.x,
      BRAIN_ORIENTATION_OFFSET.y,
      BRAIN_ORIENTATION_OFFSET.z,
      'XYZ',
    ),
  )

  return qAlignFwd.multiply(qAlignUp).multiply(qOffset)
}

function centerObject(scene) {
  const box = new THREE.Box3().setFromObject(scene)
  const center = box.getCenter(new THREE.Vector3())
  scene.position.sub(center)
  scene.updateMatrixWorld(true)
}

export function prepareBrainRoot(scene) {
  const points = collectVertices(scene)

  centerObject(scene)

  if (points.length > 0) {
    const q = computeAnatomicalQuaternion(points)
    scene.quaternion.copy(q)
    scene.updateMatrixWorld(true)
    centerObject(scene)
  }

  const box = new THREE.Box3().setFromObject(scene)
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z)
  const targetSize = getBrainTargetSize()
  scene.scale.setScalar(targetSize / maxDim)

  scene.updateMatrixWorld(true)
  centerObject(scene)

  const bounds = new THREE.Box3().setFromObject(scene)
  const radius = bounds.getSize(new THREE.Vector3()).length() * 0.5

  return { bounds, radius, scale: targetSize / maxDim }
}

export function mergeMeshGeometries(root) {
  const geometries = []
  root.updateMatrixWorld(true, true)

  root.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geo = child.geometry.clone()
      geo.applyMatrix4(child.matrixWorld)
      geometries.push(geo)
    }
  })

  if (!geometries.length) return null
  const merged = mergeGeometries(geometries, false)
  merged.computeVertexNormals()
  return merged
}

export function sampleMeshSurface(geometry, count = 180) {
  const pos = geometry.attributes.position
  const points = []
  const step = Math.max(1, Math.floor(pos.count / count))
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i += step) {
    v.fromBufferAttribute(pos, i)
    points.push(v.clone())
  }

  return points
}

export function scaleRegionPositions(regions, bounds) {
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())

  return regions.map((region) => {
    const [fx, fy, fz] = region.normalized ?? [0.5, 0.5, 0.5]

    return {
      ...region,
      position: [
        center.x + (fx - 0.5) * size.x,
        center.y + (fy - 0.5) * size.y,
        center.z + (fz - 0.5) * size.z,
      ],
      scale: region.scale.map((s, i) => {
        const dim = [size.x, size.y, size.z][i]
        return s * dim * 0.35
      }),
    }
  })
}
