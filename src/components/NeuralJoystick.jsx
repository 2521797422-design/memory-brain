import { useCallback, useEffect, useRef, useState } from 'react'
import { useBrainRotation } from '../context/BrainRotationContext'

const BASE = 96
const KNOB = 28
const TRAVEL = 34

const ORBIT_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  angle: (i / 10) * Math.PI * 2,
  radius: 38 + (i % 3) * 4,
  delay: i * 0.35,
}))

export function NeuralJoystick() {
  const baseRef = useRef(null)
  const { setJoystick } = useBrainRotation()
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)
  const dragging = useRef(false)
  const pointerId = useRef(null)

  const updateFromPointer = useCallback(
    (clientX, clientY) => {
      const el = baseRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      let dx = clientX - cx
      let dy = clientY - cy
      const dist = Math.hypot(dx, dy) || 1
      const max = TRAVEL

      if (dist > max) {
        dx = (dx / dist) * max
        dy = (dy / dist) * max
      }

      const nx = dx / max
      const ny = dy / max
      setKnob({ x: dx, y: dy })
      setJoystick(nx, ny, true)
    },
    [setJoystick],
  )

  const release = useCallback(() => {
    dragging.current = false
    pointerId.current = null
    setActive(false)
    setKnob({ x: 0, y: 0 })
    setJoystick(0, 0, false)
  }, [setJoystick])

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || e.pointerId !== pointerId.current) return
      updateFromPointer(e.clientX, e.clientY)
    }
    const onUp = (e) => {
      if (e.pointerId !== pointerId.current) return
      release()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [updateFromPointer, release])

  const onPointerDown = (e) => {
    e.preventDefault()
    dragging.current = true
    pointerId.current = e.pointerId
    setActive(true)
    baseRef.current?.setPointerCapture(e.pointerId)
    updateFromPointer(e.clientX, e.clientY)
  }

  const glow = active ? 1 : 0.55

  return (
    <div
      className="pointer-events-auto fixed bottom-8 right-6 z-30 sm:bottom-10 sm:right-10"
      aria-label="Neural wander control"
      role="application"
    >
      <p className="font-body mb-2 text-right text-[9px] font-light tracking-[0.32em] text-violet-300/35 uppercase">
        wander
      </p>

      <div
        ref={baseRef}
        className="relative touch-none select-none"
        style={{ width: BASE, height: BASE }}
        onPointerDown={onPointerDown}
        onLostPointerCapture={release}
      >
        {ORBIT_PARTICLES.map((p) => (
          <span
            key={p.id}
            className="joystick-orbit-particle pointer-events-none absolute left-1/2 top-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-200/50"
            style={{
              '--a': `${p.angle}rad`,
              '--r': `${p.radius}px`,
              '--d': `${p.delay}s`,
              opacity: active ? 0.7 : 0.35,
            }}
          />
        ))}

        <div
          className="absolute inset-0 rounded-full border border-violet-200/15 bg-violet-950/25 shadow-[0_0_40px_rgba(180,140,180,0.12)] backdrop-blur-md transition-shadow duration-500"
          style={{
            boxShadow: `0 0 ${32 * glow}px rgba(200, 170, 210, ${0.08 * glow}), inset 0 0 24px rgba(120, 80, 120, 0.08)`,
          }}
        />

        <div
          className="pointer-events-none absolute inset-2 rounded-full border border-violet-100/10"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, rgba(240,220,235,0.08) 0%, transparent 55%)',
          }}
        />

        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[58%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-violet-200/8"
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[58%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-violet-200/8"
        />

        <div
          className="absolute left-1/2 top-1/2 rounded-full transition-[box-shadow,transform] duration-300 ease-out will-change-transform"
          style={{
            width: KNOB,
            height: KNOB,
            marginLeft: -KNOB / 2,
            marginTop: -KNOB / 2,
            transform: `translate(${knob.x}px, ${knob.y}px)`,
            boxShadow: active
              ? '0 0 22px rgba(230, 200, 220, 0.45), 0 0 8px rgba(180, 140, 200, 0.3)'
              : '0 0 14px rgba(200, 170, 210, 0.25)',
          }}
        >
          <div className="h-full w-full rounded-full border border-violet-100/25 bg-gradient-to-br from-violet-200/35 to-violet-400/15 backdrop-blur-sm" />
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-50/60" />
        </div>
      </div>
    </div>
  )
}
