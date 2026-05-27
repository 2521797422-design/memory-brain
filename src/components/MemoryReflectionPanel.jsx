import { useEffect, useRef, useState } from 'react'
import { useMemoryReflection } from '../context/MemoryReflectionContext'

export function MemoryReflectionPanel({ memory, visible }) {
  const { getReflection, setReflection, savePulse } = useMemoryReflection()
  const [text, setText] = useState(() => getReflection(memory))
  const textareaRef = useRef(null)

  useEffect(() => {
    setText(getReflection(memory))
  }, [memory.id])

  useEffect(() => {
    if (visible && textareaRef.current) {
      const id = requestAnimationFrame(() => textareaRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [visible, memory.id])

  const handleChange = (e) => {
    const next = e.target.value
    setText(next)
    setReflection(memory.id, next)
  }

  return (
    <aside
      className={`pointer-events-auto flex w-full max-w-md flex-col transition-all duration-1000 ease-out lg:max-w-sm ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="memory-reflection-glass rounded-lg border border-violet-200/10 px-6 py-7 sm:px-7 sm:py-8">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <p className="font-body text-[9px] tracking-[0.42em] text-violet-300/40 uppercase">
            reflection
          </p>
          <span
            className={`font-body text-[9px] tracking-[0.2em] text-violet-400/30 uppercase transition-opacity duration-700 ${
              savePulse ? 'opacity-100' : 'opacity-0'
            }`}
            aria-live="polite"
          >
            held
          </span>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          rows={8}
          spellCheck
          placeholder="What returns when you close your eyes…"
          className="memory-reflection-input font-display w-full resize-none bg-transparent text-lg font-light leading-[1.75] text-violet-50/88 italic outline-none placeholder:text-violet-200/20 sm:text-xl"
          aria-label={`Reflection for ${memory.title}`}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 px-1">
        {memory.emotionalTags.map((tag) => (
          <span
            key={tag}
            className="font-body rounded-full border border-violet-200/8 px-2.5 py-0.5 text-[8px] tracking-[0.22em] text-violet-300/30 uppercase"
          >
            {tag}
          </span>
        ))}
      </div>
    </aside>
  )
}
