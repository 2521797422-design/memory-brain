/** Free-floating exploration — cinematic inertia, no hard yaw stops. */
export const BRAIN_ROTATION = {
  /** Max rotation speed from full joystick deflection (rad/s). */
  joystickMaxSpeed: 0.72,
  /** How quickly brain velocity follows joystick. */
  joystickTorque: 4.8,
  /** Velocity decay per second when joystick centered. */
  damping: 3.2,
  /** Scale velocity on joystick release. */
  releaseInertia: 0.68,
  /**
   * Pitch: soft resistance begins here (~±74°).
   * No spring below this — feels unrestricted.
   */
  pitchSoftLimit: 1.28,
  /** Absolute pitch cap (~±88°) to avoid disorienting flip. */
  pitchHardLimit: 1.54,
  /** Gentle push-back only beyond soft limit. */
  pitchSpring: 3.5,
  /** Idle drift when not interacting. */
  idleSway: 0.012,
}
