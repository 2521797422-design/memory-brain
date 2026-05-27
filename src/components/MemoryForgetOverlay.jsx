import { useEffect, useRef } from 'react'
import { FORGET_DURATION_MS } from '../config/memoryForget'
import { useMemoryRegistry } from '../context/MemoryRegistryContext'

function createBurst(effect) {
  const particles = []
  const w = effect.width ?? 80
  const h = effect.height ?? 100
  for (let i = 0; i < 52; i++) {
    particles.push({
      x: effect.screenX + (Math.random() - 0.5) * w * 0.55,
      y: effect.screenY + (Math.random() - 0.5) * h * 0.55,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.12 - Math.random() * 0.5,
      size: 0.5 + Math.random() * 2.4,
      life: 0.9 + Math.random() * 0.1,
      decay: 0.0055 + Math.random() * 0.009,
      hue: 258 + Math.random() * 45,
    })
  }
  return { id: effect.id, startedAt: effect.startedAt, particles }
}

export function MemoryForgetOverlay() {
  const { dissolveEffects, clearDissolveEffect } = useMemoryRegistry()
  const canvasRef = useRef(null)
  const burstsRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    dissolveEffects.forEach((effect) => {
      if (!burstsRef.current.some((b) => b.id === effect.id)) {
        burstsRef.current.push(createBurst(effect))
      }
    })
  }, [dissolveEffects])

  useEffect(() => {
    if (dissolveEffects.length === 0) {
      burstsRef.current = []
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return { w, h }
    }

    let { w, h } = resize()
    const onResize = () => {
      ;({ w, h } = resize())
    }
    window.addEventListener('resize', onResize)

    const tick = () => {
      const now = Date.now()
      ctx.clearRect(0, 0, w, h)

      burstsRef.current = burstsRef.current.filter((burst) => {
        const t = Math.min(1, (now - burst.startedAt) / FORGET_DURATION_MS)
        let alive = 0

        burst.particles.forEach((p) => {
          if (p.life <= 0) return
          alive++
          p.x += p.vx * (1 - t * 0.25)
          p.y += p.vy * (1 - t * 0.15)
          p.vy -= 0.0018
          p.life -= p.decay

          const alpha = p.life * (1 - t * 0.55)
          if (alpha <= 0) return

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (0.4 + alpha * 0.6), 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue}, 38%, 80%, ${alpha * 0.5})`
          ctx.fill()
        })

        if (t >= 1) {
          clearDissolveEffect(burst.id)
          return false
        }
        return alive > 0 || t < 0.98
      })

      if (burstsRef.current.length > 0 || dissolveEffects.length > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', onResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [dissolveEffects, clearDissolveEffect])

  if (dissolveEffects.length === 0) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[45]"
      aria-hidden
    />
  )
}
