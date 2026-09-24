import { motion } from 'motion/react';

type Props = { beatsPerBar: number; beat: number | null; accent: boolean };

export function BeatDots({ beatsPerBar, beat, accent }: Props) {
  return (
    <div className="flex h-4 items-center justify-center gap-3.5" aria-hidden>
      {Array.from({ length: beatsPerBar }, (_, i) => {
        const active = beat === i;
        const isAccent = accent && i === 0 && beatsPerBar > 1;
        return (
          <motion.span
            key={i}
            className="block size-2 rounded-full"
            initial={false}
            animate={{
              scale: active ? 1.5 : 1,
              backgroundColor: active
                ? isAccent
                  ? '#dcbf8a'
                  : '#fafafa'
                : isAccent
                  ? 'rgba(220,191,138,0.28)'
                  : 'rgba(255,255,255,0.14)',
              boxShadow: active
                ? `0 0 14px ${isAccent ? 'rgba(220,191,138,0.7)' : 'rgba(255,255,255,0.45)'}`
                : '0 0 0px rgba(0,0,0,0)',
            }}
            transition={{ duration: active ? 0.06 : 0.35, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
