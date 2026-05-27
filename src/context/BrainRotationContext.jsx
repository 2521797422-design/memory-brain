import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react'
import { BRAIN_INITIAL_ROTATION } from '../config/brainModel'
import { BRAIN_ROTATION } from '../config/brainRotation'

const BrainRotationContext = createContext(null)

function createState() {
  return {
    yaw: BRAIN_INITIAL_ROTATION.yaw,
    pitch: BRAIN_INITIAL_ROTATION.pitch,
    yawVel: 0,
    pitchVel: 0,
    dragging: false,
    joystick: { active: false, x: 0, y: 0 },
  }
}

export function BrainRotationProvider({ children }) {
  const state = useRef(createState())

  const setJoystick = useCallback((x, y, active) => {
    const s = state.current
    s.joystick.x = x
    s.joystick.y = y
    s.joystick.active = active
    s.dragging = active
    if (!active) {
      s.yawVel *= BRAIN_ROTATION.releaseInertia
      s.pitchVel *= BRAIN_ROTATION.releaseInertia
    }
  }, [])

  const value = useMemo(
    () => ({
      state,
      setJoystick,
    }),
    [setJoystick],
  )

  return (
    <BrainRotationContext.Provider value={value}>
      {children}
    </BrainRotationContext.Provider>
  )
}

export function useBrainRotation() {
  const ctx = useContext(BrainRotationContext)
  if (!ctx) {
    throw new Error('useBrainRotation must be used within BrainRotationProvider')
  }
  return ctx
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

export function stepBrainRotation(s, delta) {
  const {
    damping,
    pitchSoftLimit,
    pitchHardLimit,
    pitchSpring,
    idleSway,
    joystickMaxSpeed,
    joystickTorque,
  } = BRAIN_ROTATION

  if (s.joystick.active) {
    const targetYaw = s.joystick.x * joystickMaxSpeed
    const targetPitch = s.joystick.y * joystickMaxSpeed
    const follow = 1 - Math.exp(-joystickTorque * delta)
    s.yawVel += (targetYaw - s.yawVel) * follow
    s.pitchVel += (targetPitch - s.pitchVel) * follow
  } else {
    const decay = Math.exp(-damping * delta)
    s.yawVel *= decay
    s.pitchVel *= decay
  }

  s.yaw += s.yawVel * delta
  s.pitch += s.pitchVel * delta

  // Yaw: unlimited 360° — no clamp, no spring
  s.pitchVel = applySoftPitchLimit(
    s.pitch,
    s.pitchVel,
    pitchSoftLimit,
    pitchHardLimit,
    pitchSpring,
    delta,
  )
  s.pitch = clamp(s.pitch, -pitchHardLimit, pitchHardLimit)

  return {
    yaw: s.yaw,
    pitch: s.pitch,
    dragging: s.dragging,
    idleSway,
  }
}

function applySoftPitchLimit(pitch, vel, soft, hard, spring, delta) {
  const abs = Math.abs(pitch)
  if (abs <= soft) return vel

  const overshoot = abs - soft
  const range = hard - soft || 1
  const t = Math.min(1, overshoot / range)
  const resistance = t * t * spring

  return vel - Math.sign(pitch) * overshoot * resistance * delta
}
