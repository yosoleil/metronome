import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { useEffect } from 'react';
import type { BeatEvent } from '../audio/MetronomeEngine.ts';
import { squish } from '../lib/jelly.ts';

type Props = { playing: boolean; onBeat: (fn: (e: BeatEvent) => void) => () => void };

/** "再生中" bubble beside the title; its note bounces with the beat. */
export function StatusPill({ playing, onBeat }: Props) {
  return (
    <AnimatePresence>
      {playing && (
        <motion.span
          initial={{ opacity: 0, scale: 0.3, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.3, rotate: 8, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', bounce: 0.55, duration: 0.5 }}
          className="flex h-8 items-center gap-1.5 rounded-full bg-mint-pale pr-3.5 pl-2.5 text-[13px] font-extrabold text-ink"
        >
          <BeatNote onBeat={onBeat} />
          再生中
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function BeatNote({ onBeat }: Pick<Props, 'onBeat'>) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  useEffect(
    () =>
      onBeat(({ accent }) => {
        squish(animate, scope.current, accent ? 0.25 : 0.15);
        animate(scope.current, { y: [-4, 0] }, { type: 'spring', bounce: 0.6, duration: 0.4 });
      }),
    [onBeat, animate, scope],
  );
  return (
    <span ref={scope} className="flex size-5 items-center justify-center rounded-full bg-mint text-[11px] text-white">
      ♪
    </span>
  );
}
