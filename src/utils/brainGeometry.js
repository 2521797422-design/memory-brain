import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const SCALE = { x: 1.38, y: 1.02, z: 1.62 }

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function hash3(x, y, z, seed = 0) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.7) * 43758.5453
  return s - Math.floor(s)
}

function gyriNoise(x, y, z, seed = 0) {
  const n1 =
    Math.sin(x * 11.2 + y * 7.8 + z * 9.4 + seed) * 0.042 +
    Math.sin(x * 19.5 + z * 14.1 + seed * 2.1) * 0.028 +
    Math.sin(y * 22.3 + z * 16.7 + seed * 1.3) * 0.024

  const n2 =
    Math.sin(x * 31 + y * 27 + z * 29 + seed) * 0.016 +
    Math.sin(x * 43 + y * 41 + seed) * 0.012

  const micro =
    (hash3(x * 8, y * 8, z * 8, seed) - 0.5) * 0.018

  return n1 + n2 + micro
}

function sulcusGroove(x, y, z) {
  const centralSulcus =
    smoothstep(0.15, 0.55, z) *
    smoothstep(0.85, 0.45, z) *
    (1 - smoothstep(0.1, 0.35, Math.abs(x))) *
    0.06

  const lateralSulcus =
    smoothstep(0.55, 0.2, Math.abs(x)) *
    smoothstep(-0.35, 0.05, y) *
    smoothstep(0.5, -0.1, z) *
    0.05

  const parietoOccipital =
    smoothstep(-0.35, -0.65, z) *
    smoothstep(0.2, 0.55, y) *
    0.04

  return centralSulcus + lateralSulcus + parietoOccipital
}

function cerebralPoint(v, side) {
  let px = v.x * SCALE.x
  let py = v.y * SCALE.y + 0.06
  let pz = v.z * SCALE.z

  const asym = side === 'right' ? 1.018 : 0.992
  const jitter = (hash3(v.x, v.y, v.z, side === 'right' ? 2 : 1) - 0.5) * 0.022

  const frontal =
    1 +
    0.2 *
      smoothstep(0.25, 0.85, pz) *
      smoothstep(0.55, 0.05, Math.abs(px)) *
      smoothstep(-0.15, 0.55, py)

  const temporal =
    1 +
    0.24 *
      Math.exp(-((py + 0.12) ** 2) / 0.07) *
      smoothstep(0.32, 0.78, Math.abs(px)) *
      smoothstep(-0.15, 0.55, pz)

  const parietal =
    1 +
    0.1 *
      smoothstep(0.25, 0.75, py) *
      smoothstep(-0.35, 0.45, Math.abs(pz))

  const occipital =
    1 +
    0.14 *
      smoothstep(-0.25, -0.75, pz) *
      smoothstep(-0.1, 0.45, py)

  const precentralBump =
    1 +
    0.06 *
      smoothstep(0.35, 0.65, pz) *
      smoothstep(0.15, 0.55, py) *
      (1 - smoothstep(0.05, 0.35, Math.abs(px)))

  let r =
    (1 + gyriNoise(px, py, pz, side === 'right' ? 1 : 0) - sulcusGroove(px, py, pz)) *
    frontal *
    temporal *
    parietal *
    occipital *
    precentralBump *
    asym *
    (1 + jitter)

  px *= r
  py *= r
  pz *= r

  if (side === 'left') {
    if (px > -0.04) px = -0.04 - Math.abs(px) * 0.12
    px -= 0.02
  } else {
    if (px < 0.04) px = 0.04 + Math.abs(px) * 0.12
    px += 0.02
  }

  return new THREE.Vector3(px, py, pz)
}

function displaceGeometry(geo, mapper) {
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    const p = mapper(v)
    pos.setXYZ(i, p.x, p.y, p.z)
  }
  geo.computeVertexNormals()
  return geo
}

function createHighSphere() {
  return new THREE.SphereGeometry(1, 96, 96)
}

export function createCerebralHemisphereGeometry(side) {
  return displaceGeometry(createHighSphere(), (v) => cerebralPoint(v, side))
}

function cerebellumPoint(v) {
  const px = v.x * 1.15
  const py = v.y * 0.52 - 0.48
  const pz = v.z * 0.95 - 0.58
  const hemisSep = Math.sign(px) * 0.04
  const fold = gyriNoise(px * 2, py * 2, pz * 2, 3) * 0.8
  const r = 1 + fold - sulcusGroove(px, py, pz) * 0.5
  return new THREE.Vector3(
    px * r + hemisSep,
    py * r,
    pz * r,
  )
}

export function createCerebellumGeometry() {
  const geo = new THREE.SphereGeometry(1, 72, 72)
  return displaceGeometry(geo, cerebellumPoint)
}

function stemProfile() {
  return [
    new THREE.Vector2(0.04, -1.05),
    new THREE.Vector2(0.07, -0.95),
    new THREE.Vector2(0.11, -0.82),
    new THREE.Vector2(0.14, -0.68),
    new THREE.Vector2(0.16, -0.52),
    new THREE.Vector2(0.14, -0.38),
    new THREE.Vector2(0.1, -0.28),
  ]
}

export function createBrainStemGeometry() {
  const geo = new THREE.LatheGeometry(stemProfile(), 32)
  geo.rotateX(Math.PI / 2)
  geo.translate(0, -0.08, 0.12)
  geo.computeVertexNormals()
  return geo
}

function normalizeGroup(geometries) {
  const merged = mergeGeometries(geometries, false)
  merged.computeBoundingBox()
  const box = merged.boundingBox
  const center = new THREE.Vector3()
  box.getCenter(center)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  const target = 2.05
  const s = target / maxDim

  const apply = (geo) => {
    geo.translate(-center.x, -center.y, -center.z)
    geo.scale(s, s, s)
    geo.computeBoundingBox()
    geo.computeBoundingSphere()
    return geo
  }

  merged.dispose()
  return geometries.map(apply)
}

export function createAnatomicalBrain() {
  const left = createCerebralHemisphereGeometry('left')
  const right = createCerebralHemisphereGeometry('right')
  const cerebellum = createCerebellumGeometry()
  const stem = createBrainStemGeometry()

  const [nLeft, nRight, nCerebellum, nStem] = normalizeGroup([
    left,
    right,
    cerebellum,
    stem,
  ])

  const full = mergeGeometries([nLeft, nRight, nCerebellum, nStem], false)
  full.computeVertexNormals()

  return {
    left: nLeft,
    right: nRight,
    cerebellum: nCerebellum,
    stem: nStem,
    full,
  }
}

export function sampleSurfacePoints(geometry, count = 120) {
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

export function extractSulciLines(geometry, maxLines = 90) {
  const pos = geometry.attributes.position
  const lines = []
  const step = Math.max(3, Math.floor(pos.count / maxLines))
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()

  for (let i = 0; i < pos.count - step; i += step) {
    a.fromBufferAttribute(pos, i)
    b.fromBufferAttribute(pos, i + 1)
    c.fromBufferAttribute(pos, i + step)
    const curvature = b.distanceTo(a) + b.distanceTo(c) - a.distanceTo(c)
    if (curvature < 0.018) {
      lines.push(a.clone(), b.clone())
    }
  }

  const arr = new Float32Array(lines.length * 3)
  lines.forEach((v, i) => {
    arr[i * 3] = v.x
    arr[i * 3 + 1] = v.y
    arr[i * 3 + 2] = v.z
  })
  return arr
}

// Legacy exports for any remaining imports
export function createHemisphereGeometry(side) {
  return createCerebralHemisphereGeometry(side)
}
