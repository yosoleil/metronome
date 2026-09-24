import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { JELLY } from '../lib/jelly.ts';

type Props = {
  beatsPerBar: number;
  onBeatsPerBarChange: (n: number) => void;
  accent: boolean;
  onAccentChange: (on: boolean) => void;
};

// A thick, soft card. Rows are separated by space, never by lines.
export function SettingsCard({ beatsPerBar, onBeatsPerBarChange, accent, onAccentChange }: Props) {
  return (
    <section className="w-full">
      <div className="chunky flex flex-col gap-2 rounded-[28px] bg-card p-3 text-[16px]">
        <div className="flex items-center gap-2.5">
          <IconBubble className="bg-mustard-pale text-mustard-deep">
            {/* Quarter note */}
            <ellipse cx="9" cy="17" rx="4" ry="3.1" transform="rotate(-22 9 17)" fill="currentColor" />
            <path d="M12.5 16V4.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </IconBubble>
          <span id="beats-label" className="shrink-0 font-extrabold">
            拍子
          </span>
          <SegmentedControl value={beatsPerBar} onChange={onBeatsPerBarChange} labelledBy="beats-label" />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 pr-1">
          <IconBubble className="bg-coral-pale text-coral">
            {/* Accent mark (>) */}
            <path d="M6.5 7.5l11 4.5-11 4.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </IconBubble>
          <span id="accent-label" className="flex-1 font-extrabold">
            1拍目を強調
          </span>
          <Switch on={accent} onChange={onAccentChange} labelledBy="accent-label" describedBy="accent-note" />
        </label>
      </div>
      <p id="accent-note" className="px-5 pt-3 text-[13px] leading-[18px] font-bold text-ink-soft">
        {accent && beatsPerBar > 1 ? '小節のはじまりを高い音でお知らせします。' : 'すべての拍を同じ音で鳴らします。'}
      </p>
    </section>
  );
}

function IconBubble({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span aria-hidden className={`flex size-10 shrink-0 items-center justify-center rounded-full ${className}`}>
      <svg width="22" height="22" viewBox="0 0 24 24">
        {children}
      </svg>
    </span>
  );
}

const OPTIONS = [1, 2, 3, 4, 5, 6, 7];

function SegmentedControl({ value, onChange, labelledBy }: { value: number; onChange: (n: number) => void; labelledBy: string }) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="ml-auto flex max-w-[264px] flex-1 rounded-full bg-bg-deep p-1"
      onKeyDown={(e) => {
        const delta = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
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
          <motion.button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${n}拍`}
            tabIndex={selected ? 0 : -1}
            data-value={n}
            onClick={() => onChange(n)}
            whileTap={{ scale: 0.82 }}
            transition={JELLY}
            className="relative h-9 flex-1 rounded-full text-[15px] font-black tabular-nums focus-visible:ring-4 focus-visible:ring-mustard/50 focus-visible:outline-none"
          >
            {selected && (
              <motion.span
                layoutId="beats-thumb"
                className="chunky-sm absolute inset-x-0 top-0 bottom-1 rounded-full bg-mustard [--edge:var(--color-mustard-deep)]"
                transition={{ type: 'spring', bounce: 0.45, duration: 0.5 }}
              />
            )}
            <span className={`relative -top-0.5 transition-colors duration-200 ${selected ? 'text-cocoa' : 'text-ink-soft'}`}>{n}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function Switch({
  on,
  onChange,
  labelledBy,
  describedBy,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  labelledBy: string;
  describedBy: string;
}) {
  // While pressed the knob stretches toward the side it will travel.
  const [pressed, setPressed] = useState(false);
  const release = () => setPressed(false);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!on)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className={`relative h-9 w-[60px] shrink-0 rounded-full p-1 transition-colors duration-300 focus-visible:ring-4 focus-visible:ring-mint/40 focus-visible:outline-none ${
        on ? 'bg-mint' : 'bg-ink-faint'
      }`}
    >
      <motion.span
        className="chunky-sm block h-6 rounded-full bg-white [--edge:rgb(0_0_0/0.12)]"
        initial={false}
        animate={{ width: pressed ? 32 : 24, x: on ? (pressed ? 20 : 28) : 0 }}
        transition={JELLY}
      />
    </button>
  );
}
