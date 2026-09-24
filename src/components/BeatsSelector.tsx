import { motion } from 'motion/react';

const OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function BeatsSelector({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span id="beats-label" className="text-[10px] font-semibold tracking-[0.32em] text-zinc-500">
        BEATS / BAR
      </span>
      <div
        role="radiogroup"
        aria-labelledby="beats-label"
        className="flex rounded-full border border-white/[0.07] bg-white/[0.02] p-1"
        onKeyDown={(e) => {
          const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!delta) return;
          e.preventDefault();
          e.stopPropagation();
          const next = Math.min(7, Math.max(1, value + delta));
          onChange(next);
          (e.currentTarget.querySelector(`[data-value="${next}"]`) as HTMLElement | null)?.focus();
        }}
      >
        {OPTIONS.map((n) => {
          const selected = n === value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-value={n}
              onClick={() => onChange(n)}
              className={`relative flex size-9 items-center justify-center rounded-full text-sm tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none ${
                selected ? 'text-ink' : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="beats-pill"
                  className="absolute inset-0 rounded-full bg-zinc-100"
                  transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                />
              )}
              <span className="relative font-medium">{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
