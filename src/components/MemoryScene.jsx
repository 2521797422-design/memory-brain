import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { FloatingParticles } from './FloatingParticles'
import { GlowingBrain } from './GlowingBrain'
import { NeuralNetwork } from './NeuralNetwork'
import { ParallaxRig } from './ParallaxRig'
import { PointerReset } from './PointerReset'
import { MemoryCamera } from './MemoryCamera'
import { MemoryNodes } from './MemoryNodes'
import { SceneDemandDriver } from './SceneDemandDriver'
import { SCENE_CAMERA } from '../config/brainModel'

function SceneLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#6a5080" transparent opacity={0.4} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <PointerReset />
      <MemoryCamera />
      <color attach="background" args={['#03020a']} />
      <fog attach="fog" args={['#03020a', 8, 28]} />
      <ambientLight intensity={0.14} color="#9a8aa8" />
      <hemisphereLight
        args={['#e8d8e4', '#0a0612', 0.4]}
        position={[0, 1, 0]}
      />
      <directionalLight
        position={[4, 7, 5]}
        intensity={0.32}
        color="#faf4f8"
      />
      <directionalLight
        position={[-5, 1, -2]}
        intensity={0.12}
        color="#7a6a88"
      />
      <FloatingParticles />
      <ParallaxRig>
        <NeuralNetwork />
        <GlowingBrain />
        <MemoryNodes />
      </ParallaxRig>
    </>
  )
}

export function MemoryScene({ immersiveVideo = false }) {
  return (
    <Canvas
      className="!fixed !inset-0 !h-screen !w-screen"
      style={{ width: '100vw', height: '100vh' }}
      frameloop={immersiveVideo ? 'demand' : 'always'}
      camera={{
        position: SCENE_CAMERA.position,
        fov: SCENE_CAMERA.fov,
        near: SCENE_CAMERA.near,
        far: SCENE_CAMERA.far,
      }}
      dpr={immersiveVideo ? [0.75, 1.25] : [1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={<SceneLoader />}>
        {immersiveVideo && <SceneDemandDriver />}
        <Scene />
      </Suspense>
    </Canvas>
  )
}
