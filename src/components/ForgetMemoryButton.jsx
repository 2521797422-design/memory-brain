/** Minimal “release from consciousness” control — visible on group hover. */
export function ForgetMemoryButton({ onForget, className = '' }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onForget(e)
      }}
      title="Let this memory dissolve"
      aria-label="Forget memory"
      className={`font-body absolute z-20 flex h-6 w-6 items-center justify-center rounded-full border border-violet-200/15 bg-[#03020a]/70 text-[11px] text-violet-200/50 opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:opacity-100 hover:border-violet-200/30 hover:bg-violet-950/80 hover:text-violet-100/75 ${className}`}
    >
      <span className="scale-90 leading-none">×</span>
    </button>
  )
}
