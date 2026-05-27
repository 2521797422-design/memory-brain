/** Soft atmospheric level — present inside the space, never dominant. */
export const AMBIENT_VOLUME = 0.32

/** Imported cinematic ambient track (Brian Eno — An Ending). */
const AMBIENT_TRACK_FILE = 'Brian Eno - An Ending (Ascent) [1080 HD].mp3'
export const AMBIENT_TRACK_PATH = `/audio/${encodeURIComponent(AMBIENT_TRACK_FILE)}`

/** Long fade-in when consciousness awakens (seconds). */
export const AMBIENT_FADE_IN_S = 4.8

/** Gentle fade when soundscape is silenced (seconds). */
export const AMBIENT_FADE_OUT_S = 2.4

/** Session-only — ambient music on/off for this visit. */
export const MUSIC_SESSION_KEY = 'memory-brain-music-enabled'
