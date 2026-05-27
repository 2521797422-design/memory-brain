import { useBrainInteraction } from '../context/BrainInteractionContext'

/** True when the memory viewer is open on a video memory (HTML overlay + reduced 3D). */
export function useImmersiveVideo() {
  const { openMemory, openMemoryId } = useBrainInteraction()
  return Boolean(openMemoryId && openMemory?.mediaType === 'video')
}
