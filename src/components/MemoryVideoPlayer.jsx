import { useCallback, useEffect, useRef } from 'react'
import {
  VIDEO_VIEWER_MAX_HEIGHT_PX,
  VIDEO_VIEWER_MAX_WIDTH_PX,
} from '../config/videoPlayback'
import { unloadVideoElement } from '../utils/videoElement'
import { normalizeMemoryFilePath } from '../utils/memoryAssetPath'

/**
 * HTML overlay player — outside the WebGL canvas. Src is assigned only while active;
 * previous src is cleared on switch or close.
 */
export function MemoryVideoPlayer({ filePath, title, active, onPlayingChange }) {
  const videoRef = useRef(null)
  const loadedSrcRef = useRef(null)
  const resolvedPath = normalizeMemoryFilePath(filePath)

  const notifyPlaying = useCallback(
    (playing) => {
      onPlayingChange?.(playing)
    },
    [onPlayingChange],
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    if (!active || !resolvedPath) {
      unloadVideoElement(video)
      loadedSrcRef.current = null
      notifyPlaying(false)
      return undefined
    }

    if (loadedSrcRef.current !== resolvedPath) {
      unloadVideoElement(video)
      video.preload = 'metadata'
      video.src = resolvedPath
      video.load()
      loadedSrcRef.current = resolvedPath
    }

    return () => {
      unloadVideoElement(video)
      loadedSrcRef.current = null
      notifyPlaying(false)
    }
  }, [active, resolvedPath, notifyPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !active || !resolvedPath) return undefined

    const onPlay = () => notifyPlaying(true)
    const onPause = () => notifyPlaying(false)
    const onEnded = () => notifyPlaying(false)

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
    }
  }, [active, resolvedPath, notifyPlaying])

  if (!resolvedPath) return null

  return (
    <div
      className="memory-video-overlay pointer-events-none fixed inset-0 z-[45] flex items-center justify-center pl-[88px] sm:pl-[100px]"
      aria-hidden={!active}
    >
      <figure className="pointer-events-auto relative w-full max-w-3xl px-6 lg:max-w-4xl lg:px-10">
        <div className="relative overflow-hidden rounded-sm">
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(2,1,8,0.6)_100%)]" />
          <video
            ref={videoRef}
            className="mx-auto w-auto max-w-full object-contain"
            style={{
              maxHeight: `min(${VIDEO_VIEWER_MAX_HEIGHT_PX}px, 58vh)`,
              maxWidth: `min(${VIDEO_VIEWER_MAX_WIDTH_PX}px, 92vw)`,
            }}
            title={title}
            muted
            playsInline
            controls
            preload="none"
          />
        </div>
      </figure>
    </div>
  )
}
