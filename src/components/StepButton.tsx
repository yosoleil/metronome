import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useRepeatPress } from '../hooks/useRepeatPress.ts';

export function StepButton({ label, onStep, children }: { label: string; onStep: () => void; children: ReactNode }) {
  const handlers = useRepeatPress(onStep);
  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.9 }}
      {...handlers}
      className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition-colors select-none hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
        {children}
      </svg>
    </motion.button>
  );
}
