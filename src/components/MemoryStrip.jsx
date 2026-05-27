import { useEffect, useRef } from 'react'
import {
  isPrimaryInRegion,
  isSecondaryInRegion,
} from '../data/memories'
import { useBrainInteraction } from '../context/BrainInteractionContext'
import { useMemoryRegistry } from '../context/MemoryRegistryContext'
import { useMemoryView } from '../hooks/useMemoryView'
import { ForgetMemoryButton } from './ForgetMemoryButton'
import { MemoryMediaThumb } from './MemoryMediaThumb'

function StripCard({
  memory,
  tier,
  isHighlighted,
  isSelected,
  isDissolving,
  onSelect,
  onHighlight,
  onForget,
  filterRegion,
}) {
  const isEcho =
    filterRegion &&
    tier === 'secondary' &&
    isSecondaryInRegion(memory, filterRegion) &&
    !isPrimaryInRegion(memory, filterRegion)

  return (
    <div
      className={`group relative shrink-0 snap-center ${
        isDissolving ? 'memory-dissolving pointer-events-none' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(memory.id)}
        onMouseEnter={() => onHighlight(memory.id)}
        onMouseLeave={() => onHighlight(null)}
        disabled={isDissolving}
        aria-label={`Open memory: ${memory.title}`}
        className={`relative block cursor-pointer text-left transition-all duration-700 ease-out focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-200/30 ${
          isSelected ? 'scale-105' : isHighlighted ? 'scale-[1.04]' : 'scale-100 hover:scale-[1.03]'
        }`}
      >
        <div
          className={`relative h-[100px] w-[72px] overflow-hidden rounded-sm border backdrop-blur-md transition-all duration-700 sm:h-[112px] sm:w-[80px] ${
            isSelected
              ? 'border-violet-200/35 shadow-[0_0_32px_rgba(200,170,210,0.2)]'
              : isHighlighted
                ? 'border-violet-200/28 shadow-[0_0_24px_rgba(190,170,210,0.16)]'
                : memory.injected
                  ? 'border-violet-200/20 shadow-[0_0_16px_rgba(160,200,180,0.1)] hover:border-violet-200/28'
                  : 'border-violet-200/10 hover:border-violet-200/22'
          } ${isEcho ? 'opacity-55' : 'opacity-90'}`}
        >
          <MemoryMediaThumb memory={memory} />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#03020a]/90 via-[#03020a]/20 to-transparent" />

          {memory.mediaType === 'video' && (
            <span className="font-body pointer-events-none absolute right-1.5 top-1.5 text-[7px] tracking-widest text-violet-100/40 uppercase">
              reel
            </span>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-2 pb-2 pt-6">
            <p className="font-display truncate text-[11px] font-light italic text-violet-50/85">
              {memory.title}
            </p>
          </div>
        </div>
      </button>

      {!isDissolving && (
        <ForgetMemoryButton
          className="-right-1 -top-1"
          onForget={(e) => onForget(e, memory)}
        />
      )}

      {isEcho && (
        <span className="font-body pointer-events-none absolute -bottom-4 left-0 right-0 text-center text-[8px] tracking-[0.2em] text-violet-400/25 uppercase">
          echo
        </span>
      )}
    </div>
  )
}

export function MemoryStrip() {
  const scrollRef = useRef(null)
  const { openMemoryId, clearIfMemory } = useBrainInteraction()
  const { forgetMemory } = useMemoryRegistry()
  const {
    filterRegion,
    isRegionActive,
    items,
    count,
    highlightedId,
    selectedId,
    selectMemory,
    highlightMemory,
    isDissolving,
  } = useMemoryView()

  const handleForget = (e, memory) => {
    e.stopPropagation()
    const card = e.currentTarget.closest('.group')
    const rect = card?.getBoundingClientRect()
    clearIfMemory(memory.id)
    forgetMemory(memory.id, {
      screenX: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      screenY: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
      width: rect?.width,
      height: rect?.height,
    })
  }

  useEffect(() => {
    if (!highlightedId || !scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-memory-id="${highlightedId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [highlightedId])

  return (
    <div
      className={`memory-strip-panel pointer-events-auto fixed inset-x-0 bottom-0 z-30 border-t border-violet-200/8 bg-gradient-to-t from-[#03020a]/95 via-[#03020a]/75 to-transparent pb-4 pt-6 pl-[88px] backdrop-blur-md sm:pl-[100px] ${
        openMemoryId
          ? 'pointer-events-none translate-y-2 opacity-25 saturate-50 transition-all duration-1000'
          : isRegionActive
            ? 'memory-strip-active opacity-100'
            : 'opacity-60 transition-opacity duration-700'
      }`}
    >
      <div className="mb-3 flex items-baseline justify-between px-4 sm:px-6">
        <p className="font-body text-[9px] tracking-[0.35em] text-violet-400/35 uppercase">
          {isRegionActive
            ? `activated thoughts · ${filterRegion}`
            : 'awaiting a region'}
        </p>
        {isRegionActive && (
          <p className="font-body text-[9px] text-violet-400/25">
            {count} {count === 1 ? 'fragment' : 'fragments'}
          </p>
        )}
      </div>

      {!isRegionActive ? (
        <p className="font-body px-6 pb-4 text-xs font-light italic text-violet-300/35">
          Select a region on the brain to surface its memories…
        </p>
      ) : (
        <div
          ref={scrollRef}
          className="memory-strip-scroll flex gap-4 overflow-x-auto px-4 pb-2 sm:gap-5 sm:px-6"
        >
          {count === 0 && (
            <p className="font-body px-4 py-8 text-xs font-light italic text-violet-300/30">
              No memories in this region yet…
            </p>
          )}

          {items.map(({ memory, tier }) => {
            if (!memory?.id) return null
            return (
              <div key={memory.id} data-memory-id={memory.id}>
                <StripCard
                  memory={memory}
                  tier={tier}
                  filterRegion={filterRegion}
                  isHighlighted={highlightedId === memory.id}
                  isSelected={selectedId === memory.id}
                  isDissolving={isDissolving(memory.id)}
                  onSelect={selectMemory}
                  onHighlight={highlightMemory}
                  onForget={handleForget}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
