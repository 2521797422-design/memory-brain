/** Realistic human brain mesh (public/models/brain.glb). */
export const BRAIN_MODEL_PATH = '/models/brain.glb'

/**
 * Anatomical frame after auto-prep: +Y superior (brainstem down), +Z anterior,
 * +X patient right, −X patient left (lateral surface toward a left-side camera).
 */

/**
 * Cinematic entry reveal — left lateral profile, museum-style framing.
 */
export const ENTRY_CAMERA = {
  /** Pulled back, elevated, anterior — the reveal begins here. */
  start: {
    position: [-7.6, 0.62, 2.05],
    lookAt: [0.1, -0.14, 0.06],
  },
  /** Iconic home: left-front vantage, clean side profile on left hemisphere. */
  home: {
    position: [-5.4, 0.05, 1.05],
    lookAt: [0.08, -0.11, 0.02],
  },
  /** Seconds to ease from start → home. */
  duration: 3.6,
  /** Gentle drift after the reveal settles. */
  float: {
    positionAmp: 0.042,
    lookAmp: 0.018,
    speed: 0.3,
  },
}

/** Keep in sync with MemoryScene default / region-focus return target. */
export const SCENE_CAMERA = {
  position: [...ENTRY_CAMERA.home.position],
  lookAt: [...ENTRY_CAMERA.home.lookAt],
  fov: 36,
  near: 0.1,
  far: 50,
}

/**
 * Side-profile pose: near-zero yaw keeps anterior in depth (not frontal).
 * Tiny yaw + pitch for a composed exhibit tilt only.
 */
export const BRAIN_INITIAL_ROTATION = {
  yaw: 0.07,
  pitch: 0.03,
}

/** Fraction of visible height occupied by the brain (~0.79 ≈ 10% smaller than 0.88). */
export const BRAIN_VIEW_FILL = 0.79

/** Subtle exhibit tilt on top of anatomical alignment (+Y up, stem down). */
export const BRAIN_CINEMATIC_TILT = {
  x: 0.04,
  z: 0.035,
}

export const BRAIN_ORIENTATION_OFFSET = {
  x: 0,
  y: 0,
  z: 0,
}

export function getBrainTargetSize(
  fov = SCENE_CAMERA.fov,
  distance = Math.hypot(
    SCENE_CAMERA.position[0],
    SCENE_CAMERA.position[1],
    SCENE_CAMERA.position[2],
  ),
  fill = BRAIN_VIEW_FILL,
) {
  const vFov = (fov * Math.PI) / 180
  const visibleHeight = 2 * distance * Math.tan(vFov / 2)
  return visibleHeight * fill
}

/** Smooth ease-out for entry reveal (0 → 1). */
export function easeOutCubic(t) {
  const x = Math.min(1, Math.max(0, t))
  return 1 - (1 - x) ** 3
}
