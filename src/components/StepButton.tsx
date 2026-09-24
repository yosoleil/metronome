import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useRepeatPress } from '../hooks/useRepeatPress.ts';
import { JELLY, PRESS } from '../lib/jelly.ts';

export function StepButton({ label, onStep, children }: { label: string; onStep: () => void; children: ReactNode }) {
  const handlers = useRepeatPress(onStep);
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={`${label}（長押しで連続）`}
      whileTap={PRESS}
      transition={JELLY}
      {...handlers}
      className="chunky-sm flex size-12 shrink-0 touch-manipulation items-center justify-center rounded-full bg-card text-coral select-none active:shadow-none focus-visible:ring-4 focus-visible:ring-coral/40 focus-visible:outline-none"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" aria-hidden>
        {children}
      </svg>
    </motion.button>
  );
}
