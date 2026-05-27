/** Custom interaction sample (uploaded to /public/audio/). */
export const UI_INTERACTION_SAMPLE_PATH =
  '/audio/freesound_community-ui-click-43196.mp3'

/** Peak level after fade-in — subtle neural feedback under the ambient bed. */
export const UI_SAMPLE_PEAK_GAIN = 0.21

/** Slightly quieter when re-triggering before the previous voice ends. */
export const UI_SAMPLE_RETRIGGER_GAIN = 0.155

export const UI_SAMPLE_FADE_IN_S = 0.055
export const UI_SAMPLE_FADE_OUT_S = 0.14

/** Minimum time between new triggers (ms). */
export const UI_SAMPLE_MIN_GAP_MS = 95

/** Crossfade duration when stopping an overlapping voice (ms). */
export const UI_SAMPLE_CROSSFADE_MS = 42

/** Low-pass to soften transients as level rises (Hz). */
export const UI_SAMPLE_LOWPASS_HZ = 4500

/** Gentle slowdown for a less “clicky” feel. */
export const UI_SAMPLE_PLAYBACK_RATE = 0.94

/** Hover uses the same sample, softer. */
export const UI_MEMORY_HOVER_VOLUME_SCALE = 0.46

/** Suppress hover right after opening a memory (ms). */
export const UI_OPEN_SUPPRESS_HOVER_MS = 220
