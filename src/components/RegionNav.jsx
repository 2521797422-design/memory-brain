import { BRAIN_REGIONS } from '../config/brainRegions'
import { useBrainInteraction } from '../context/BrainInteractionContext'

export function RegionNav() {
  const { focusedRegion, selectRegion, clearFocus, openMemoryId } =
    useBrainInteraction()

  return (
    <nav
      className={`pointer-events-auto fixed left-0 top-0 z-30 flex h-full w-[88px] flex-col items-center border-r border-violet-200/6 bg-[#03020a]/35 py-10 backdrop-blur-sm transition-opacity duration-1000 sm:w-[100px] ${
        openMemoryId ? 'opacity-35' : 'opacity-100'
      }`}
      aria-label="Brain regions"
    >
      <p
        className="font-body mb-8 text-[8px] tracking-[0.35em] text-violet-400/30 uppercase"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        regions
      </p>

      <ul className="flex flex-1 flex-col items-center justify-center gap-3">
        <li>
          <button
            type="button"
            onClick={clearFocus}
            title="Global view — brain only"
            className={`font-body flex h-9 w-9 items-center justify-center rounded-full border text-[9px] tracking-wider uppercase transition-all duration-500 ${
              !focusedRegion
                ? 'border-violet-200/25 bg-violet-200/10 text-violet-100/70'
                : 'border-transparent text-violet-400/30 hover:border-violet-200/15 hover:text-violet-200/50'
            }`}
          >
            ∗
          </button>
        </li>
        {BRAIN_REGIONS.map((region) => {
          const active = focusedRegion === region.id
          return (
            <li key={region.id}>
              <button
                type="button"
                onClick={() => selectRegion(region.id)}
                title={region.label}
                className={`font-display relative flex h-11 w-11 items-center justify-center rounded-full border text-[10px] font-light italic capitalize transition-all duration-700 ${
                  active
                    ? 'border-violet-200/30 bg-violet-200/12 text-violet-50/90'
                    : 'border-violet-200/8 bg-transparent text-violet-200/40 hover:border-violet-200/20 hover:bg-violet-200/5 hover:text-violet-100/65'
                }`}
                style={{
                  boxShadow: active ? `0 0 28px ${region.color}33` : 'none',
                }}
              >
                {region.label.slice(0, 3)}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
