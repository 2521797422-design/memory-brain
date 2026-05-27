import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { BRAIN_CINEMATIC_TILT, BRAIN_MODEL_PATH } from '../config/brainModel'
import {
  stepBrainRotation,
  useBrainRotation,
} from '../context/BrainRotationContext'
import { BRAIN_REGIONS } from '../config/brainRegions'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useBrainModel } from '../context/BrainModelContext'
import {
  mergeMeshGeometries,
  prepareBrainRoot,
  sampleMeshSurface,
  scaleRegionPositions,
} from '../utils/brainModelPrep'
import { brainPulseVertex, brainPulseFragment } from '../shaders/brainPulseShader'
import { BrainSurfacePulses } from './BrainSurfacePulses'
import { BrainRegions } from './BrainRegions'

useGLTF.preload(BRAIN_MODEL_PATH)

const livingMaterial = {
  color: '#d8b8c8',
  emissive: '#4a3040',
  emissiveIntensity: 0.18,
  transmission: 0.94,
  thickness: 0.95,
  roughness: 0.42,
  metalness: 0.02,
  ior: 1.42,
  chromaticAberration: 0.008,
  anisotropy: 0.06,
  distortion: 0.03,
  distortionScale: 0.06,
  temporalDistortion: 0.03,
  clearcoat: 0.72,
  clearcoatRoughness: 0.22,
  attenuationColor: '#9a7088',
  attenuationDistance: 2.4,
  transparent: true,
  opacity: 0.86,
}

function PulseOverlay({ geometry }) {
  const matRef = useRef()
  const { activeCenter, activeRegion } = useBrainInteraction()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPulse: { value: 0.35 },
      uHighlightCenter: { value: new THREE.Vector3() },
      uHighlightStrength: { value: 0 },
      uBaseColor: { value: new THREE.Color('#6a4a5a') },
      uGlowColor: { value: new THREE.Color('#f5e8f0') },
    }),
    [],
  )

  useFrame((state) => {
    if (!matRef.current) return
    const t = state.clock.elapsedTime
    matRef.current.uniforms.uTime.value = t
    matRef.current.uniforms.uPulse.value =
      0.32 + Math.sin(t * 0.45) * 0.07 + (activeRegion ? 0.15 : 0)

    if (activeCenter) {
      matRef.current.uniforms.uHighlightCenter.value.copy(activeCenter)
      const target = activeRegion ? 1 : 0
      matRef.current.uniforms.uHighlightStrength.value +=
        (target - matRef.current.uniforms.uHighlightStrength.value) * 0.05
    } else {
      matRef.current.uniforms.uHighlightStrength.value *= 0.9
    }
  })

  if (!geometry) return null

  return (
    <mesh geometry={geometry} scale={1.006}>
      <shaderMaterial
        ref={matRef}
        vertexShader={brainPulseVertex}
        fragmentShader={brainPulseFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function RimGlow({ geometry }) {
  if (!geometry) return null
  return (
    <mesh geometry={geometry} scale={1.05}>
      <meshBasicMaterial
        color="#e8d0dc"
        transparent
        opacity={0.05}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export function GlowingBrain() {
  const groupRef = useRef()
  const { scene } = useGLTF(BRAIN_MODEL_PATH)
  const { setModel } = useBrainModel()
  const { state: rotationState } = useBrainRotation()

  const brain = useMemo(() => {
    const root = scene.clone(true)
    const { bounds, radius } = prepareBrainRoot(root)
    const geometry = mergeMeshGeometries(root)
    const surfacePoints = geometry ? sampleMeshSurface(geometry, 200) : []
    const regions = scaleRegionPositions(BRAIN_REGIONS, bounds)
    return { geometry, surfacePoints, regions, bounds, radius }
  }, [scene])

  useEffect(() => {
    setModel({
      ready: true,
      radius: brain.radius,
      bounds: brain.bounds,
      regions: brain.regions,
    })
    return () =>
      setModel({
        ready: false,
        radius: 2.2,
        bounds: null,
        regions: BRAIN_REGIONS,
      })
  }, [brain, setModel])

  useFrame((frameState, delta) => {
    if (!groupRef.current) return
    const t = frameState.clock.elapsedTime
    const breath = 1 + Math.sin(t * 0.48) * 0.022
    groupRef.current.scale.setScalar(breath)

    const { yaw, pitch, dragging, idleSway } = stepBrainRotation(
      rotationState.current,
      delta,
    )

    const idle =
      dragging ? 0 : 1
    groupRef.current.rotation.set(
      BRAIN_CINEMATIC_TILT.x +
        pitch +
        Math.sin(t * 0.22) * idleSway * idle,
      yaw + Math.sin(t * 0.18) * idleSway * 0.6 * idle,
      BRAIN_CINEMATIC_TILT.z + Math.cos(t * 0.25) * idleSway * 0.5 * idle,
    )
    groupRef.current.position.y = Math.sin(t * 0.35) * 0.04
  })

  if (!brain.geometry) return null

  return (
    <group ref={groupRef}>
      <mesh geometry={brain.geometry} castShadow receiveShadow>
        <MeshTransmissionMaterial {...livingMaterial} />
      </mesh>

      <RimGlow geometry={brain.geometry} />
      <PulseOverlay geometry={brain.geometry} />
      <BrainSurfacePulses surfacePoints={brain.surfacePoints} />
      <BrainRegions regions={brain.regions} />

      <pointLight position={[-2.2, 1.1, 2.4]} intensity={0.82} color="#fff4f8" distance={9} />
      <pointLight position={[2.4, 0.4, -1.2]} intensity={0.22} color="#b8a0c8" distance={7} />
      <pointLight position={[0.4, -1.2, -0.6]} intensity={0.26} color="#9080a8" distance={6} />
      <spotLight
        position={[-4, 3, 5]}
        angle={0.34}
        penumbra={1}
        intensity={0.45}
        color="#fff8fc"
        distance={18}
      />
    </group>
  )
}
