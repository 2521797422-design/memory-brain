import { useLayoutEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  ENTRY_CAMERA,
  SCENE_CAMERA,
  easeOutCubic,
} from '../config/brainModel'
import { useBrainInteraction } from '../context/BrainInteractionContext'

const _targetPos = new THREE.Vector3()
const _targetLook = new THREE.Vector3()
const _homePos = new THREE.Vector3(...ENTRY_CAMERA.home.position)
const _homeLook = new THREE.Vector3(...ENTRY_CAMERA.home.lookAt)
const _startPos = new THREE.Vector3(...ENTRY_CAMERA.start.position)
const _startLook = new THREE.Vector3(...ENTRY_CAMERA.start.lookAt)
const _focusOffset = new THREE.Vector3(0.35, 0.2, 2.15)

function easeOutQuint(t) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 5
}

export function MemoryCamera() {
  const { camera } = useThree()
  const { isFocused, focusCenter } = useBrainInteraction()

  const lookAt = useRef(_homeLook.clone())
  const intro = useRef({
    startTime: null,
    done: false,
    settleTime: 0,
  })

  useLayoutEffect(() => {
    camera.position.copy(_startPos)
    lookAt.current.copy(_startLook)
    camera.fov = SCENE_CAMERA.fov
    camera.near = SCENE_CAMERA.near
    camera.far = SCENE_CAMERA.far
    camera.lookAt(lookAt.current)
    camera.updateProjectionMatrix()
    intro.current = { startTime: null, done: false, settleTime: 0 }
  }, [camera])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    if (isFocused && focusCenter) {
      _targetLook.copy(focusCenter)
      _targetPos.copy(focusCenter).add(_focusOffset)
      const smooth = 1 - Math.exp(-3.2 * delta)
      camera.position.lerp(_targetPos, smooth)
      lookAt.current.lerp(_targetLook, smooth)
      camera.lookAt(lookAt.current)
      return
    }

    if (!intro.current.done) {
      if (intro.current.startTime === null) {
        intro.current.startTime = t
      }

      const elapsed = t - intro.current.startTime
      const progress = easeOutCubic(elapsed / ENTRY_CAMERA.duration)

      camera.position.lerpVectors(_startPos, _homePos, progress)
      lookAt.current.lerpVectors(_startLook, _homeLook, progress)
      camera.lookAt(lookAt.current)

      if (progress >= 1) {
        intro.current.done = true
        intro.current.settleTime = t
      }
      return
    }

    const floatAge = t - intro.current.settleTime
    const { positionAmp, lookAmp, speed } = ENTRY_CAMERA.float

    const px =
      Math.sin(floatAge * speed) * positionAmp +
      Math.sin(floatAge * speed * 0.61 + 1.2) * positionAmp * 0.35
    const py =
      Math.sin(floatAge * speed * 0.85 + 0.4) * positionAmp * 0.55
    const pz =
      Math.cos(floatAge * speed * 0.72 + 2.1) * positionAmp * 0.4

    const lx = Math.sin(floatAge * speed * 0.5) * lookAmp
    const ly = Math.cos(floatAge * speed * 0.45) * lookAmp * 0.6

    _targetPos.set(_homePos.x + px, _homePos.y + py, _homePos.z + pz)
    _targetLook.set(_homeLook.x + lx, _homeLook.y + ly, _homeLook.z)

    const settleBlend = Math.min(1, floatAge / 1.2)
    const settleEase = easeOutQuint(settleBlend)

    camera.position.lerp(_targetPos, 0.08 + settleEase * 0.06)
    lookAt.current.lerp(_targetLook, 0.08 + settleEase * 0.06)
    camera.lookAt(lookAt.current)
  })

  return null
}
