import { useEffect, useRef } from 'react'

export function useMouseParallax() {
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1
      target.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const lerp = (smooth = 0.04) => {
    current.current.x += (target.current.x - current.current.x) * smooth
    current.current.y += (target.current.y - current.current.y) * smooth
    return { x: current.current.x, y: current.current.y }
  }

  return lerp
}
