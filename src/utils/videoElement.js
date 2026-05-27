/** Release decoder / network for a video element. */
export function unloadVideoElement(video) {
  if (!video) return
  video.pause()
  video.removeAttribute('src')
  const sources = video.querySelectorAll('source')
  sources.forEach((s) => s.remove())
  video.load()
}
