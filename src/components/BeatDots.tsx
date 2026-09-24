import { motion } from 'motion/react';

type Props = { beatsPerBar: number; beat: number | null; accent: boolean };

// The current beat's bubble hops up and lands with a wobble; the accented downbeat is coral.
export function BeatDots({ beatsPerBar, beat, accent }: Props) {
  return (
    <div className="flex h-7 items-end justify-center gap-3" aria-hidden>
      {Array.from({ length: beatsPerBar }, (_, i) => {
        const active = beat === i;
        const isAccent = accent && i === 0 && beatsPerBar > 1;
        return (
          <motion.span
            key={i}
            layout
            initial={{ scale: 0 }}
            animate={{ scale: active ? 1.25 : 1, y: active ? -8 : 0 }}
            transition={active ? { type: 'spring', bounce: 0.6, duration: 0.3 } : { type: 'spring', bounce: 0.5, duration: 0.5 }}
            className={`block size-4 rounded-full transition-colors ${active ? 'duration-75' : 'duration-300'} ${
              active ? (isAccent ? 'bg-coral' : 'bg-mint') : isAccent ? 'bg-coral-pale' : 'bg-ink-faint'
            }`}
          />
        );
      })}
    </div>
  );
}
