import { motion, useAnimate } from 'motion/react';
import { useEffect, type ReactNode } from 'react';
import type { BeatEvent } from '../audio/MetronomeEngine.ts';
import { JELLY, PRESS, squish } from '../lib/jelly.ts';
import { SwapText } from './RollingNumber.tsx';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Big chunky gumdrop buttons. The halo behind is what the ripple effects animate; the inner
// `data-body` is what squishes on beats, separate from the press transform on the button itself.
function GumButton({
  scope,
  halo,
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.button> & {
  scope: React.RefObject<HTMLDivElement | null>;
  halo: string;
  children: ReactNode;
}) {
  return (
    <div ref={scope} className="relative">
      <span data-halo aria-hidden className={`pointer-events-none absolute inset-0 rounded-full opacity-0 transition-colors ${halo}`} />
      <motion.button
        type="button"
        whileTap={PRESS}
        transition={JELLY}
        className={`chunky relative flex size-[92px] shrink-0 touch-manipulation flex-col items-center justify-center rounded-full transition-colors duration-300 select-none active:shadow-[0_2px_0_var(--edge)] focus-visible:ring-4 focus-visible:ring-ink/20 focus-visible:outline-none ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    </div>
  );
}

type PlayProps = { playing: boolean; onToggle: () => void; onBeat: (fn: (e: BeatEvent) => void) => () => void };

export function PlayButton({ playing, onToggle, onBeat }: PlayProps) {
  const [scope, animate] = useAnimate<HTMLDivElement>();

  // Every beat: the button boings and a bubble puffs out of it — bigger on the downbeat.
  useEffect(
    () =>
      onBeat(({ accent, interval }) => {
        const duration = Math.min(Math.max(interval * 0.9, 0.3), 0.8);
        animate('[data-halo]', { scale: [1, accent ? 1.4 : 1.22], opacity: [accent ? 0.45 : 0.25, 0] }, { duration, ease: EASE_OUT });
        squish(animate, scope.current.querySelector('[data-body]')!, accent ? 0.12 : 0.07);
      }),
    [onBeat, animate, scope],
  );

  return (
    <GumButton
      scope={scope}
      onClick={onToggle}
      aria-pressed={playing}
      aria-label={playing ? 'ストップ' : 'スタート'}
      halo={playing ? 'bg-coral' : 'bg-mint'}
      className={playing ? 'bg-coral text-cocoa [--edge:var(--color-coral-deep)]' : 'bg-mint text-cocoa [--edge:var(--color-mint-deep)]'}
    >
      <span data-body className="flex flex-col items-center gap-0.5">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          {playing ? (
            <rect x="5.5" y="5.5" width="13" height="13" rx="3.5" />
          ) : (
            <path d="M8 5.8c0-1.2 1.3-1.9 2.3-1.3l8.6 5.4c1 .6 1 2 0 2.6l-8.6 5.4c-1 .6-2.3-.1-2.3-1.3V5.8Z" />
          )}
        </svg>
        <SwapText text={playing ? 'ストップ' : 'スタート'} className="text-[13px] font-extrabold tracking-[0.04em]" />
      </span>
    </GumButton>
  );
}

export function TapButton({ onTap }: { onTap: () => void }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();

  const tap = () => {
    onTap();
    animate('[data-halo]', { scale: [0.95, 1.3], opacity: [0.4, 0] }, { duration: 0.5, ease: EASE_OUT });
    animate('[data-ripple]', { scale: [0.55, 1], opacity: [1, 0.35] }, { type: 'spring', bounce: 0.5, duration: 0.5 });
  };

  return (
    <GumButton
      scope={scope}
      onPointerDown={(e) => {
        // Register on press rather than release — taps should land exactly on the beat.
        if (e.button === 0) tap();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!e.repeat) tap();
        }
      }}
      data-tap
      aria-label="タップしてテンポを設定"
      title="リズムに合わせて2回以上タップ（T キー）"
      halo="bg-mustard"
      className="bg-mustard text-cocoa [--edge:var(--color-mustard-deep)]"
    >
      <span className="flex flex-col items-center gap-0.5">
        <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
          <circle data-ripple cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2.6" opacity="0.35" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
          <circle cx="12" cy="12" r="5" fill="currentColor" />
        </svg>
        <span className="text-[13px] font-extrabold tracking-[0.04em]">タップ</span>
      </span>
    </GumButton>
  );
}
