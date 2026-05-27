import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { SCENE_THROTTLE_FPS } from '../config/videoPlayback'

/** Keeps demand frameloop alive at a low rate while immersive video is open. */
export function SceneDemandDriver() {
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const ms = 1000 / SCENE_THROTTLE_FPS
    const id = setInterval(() => invalidate(), ms)
    invalidate()
    return () => clearInterval(id)
  }, [invalidate])

  return null
}
