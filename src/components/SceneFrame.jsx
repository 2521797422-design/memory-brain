import { MemoryScene } from './MemoryScene'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useImmersiveVideo } from '../hooks/useImmersiveVideo'

export function SceneFrame() {
  const { openMemoryId } = useBrainInteraction()
  const immersiveVideo = useImmersiveVideo()

  return (
    <div
      className={`fixed inset-0 h-screen w-screen transition-[filter,opacity] duration-1000 ease-out ${
        immersiveVideo
          ? 'brightness-[0.28] saturate-[0.5]'
          : openMemoryId
            ? 'brightness-[0.38] saturate-[0.65]'
            : 'brightness-100 saturate-100'
      }`}
    >
      <MemoryScene immersiveVideo={immersiveVideo} />
    </div>
  )
}
