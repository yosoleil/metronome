import { motion, type Variants } from 'motion/react';
import { useEffect } from 'react';
import { BeatDots } from './components/BeatDots.tsx';
import { BpmDisplay } from './components/BpmDisplay.tsx';
import { Pendulum } from './components/Pendulum.tsx';
import { SettingsCard } from './components/SettingsCard.tsx';
import { StatusPill } from './components/StatusPill.tsx';
import { PlayButton, TapButton } from './components/Transport.tsx';
import { useMetronome } from './hooks/useMetronome.ts';
import { useTapTempo } from './hooks/useTapTempo.ts';
import { useWakeLock } from './hooks/useWakeLock.ts';

// Launch: sections settle in one after another.
const stagger: Variants = { show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', bounce: 0.45, duration: 0.7 } },
};

export default function App() {
  const m = useMetronome();
  const tap = useTapTempo(m.setBpm);
  useWakeLock(m.playing);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;

      if (e.code === 'Space') {
        // Space is always play/stop, like a DAW — except on TAP and switches, which use it themselves.
        if (target.closest('[data-tap], [role="switch"]')) return;
        e.preventDefault();
        if (!e.repeat) m.toggle();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (target.closest('[role="slider"], [role="radiogroup"]')) return; // handle their own arrows
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
        m.setBpm((b) => b + step);
      } else if (e.key === 't' || e.key === 'T') {
        if (!e.repeat) tap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [m.toggle, m.setBpm, tap]);

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <Blobs />
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-4"
      >
        <motion.header variants={rise} className="flex items-center justify-between gap-3 pt-[clamp(0.5rem,2.5svh,2.5rem)] pb-[clamp(0.25rem,1.5svh,1rem)]">
          <h1 className="flex items-center gap-2.5 text-[28px] leading-9 font-extrabold tracking-[0.02em]">
            <Logo />
            メトロノーム
          </h1>
          <StatusPill playing={m.playing} onBeat={m.onBeat} />
        </motion.header>

        <main className="flex flex-1 flex-col items-center justify-center gap-[clamp(0.6rem,2svh,1.4rem)] py-[clamp(0.25rem,1.5svh,1.5rem)]">
          <motion.div variants={rise} className="w-full">
            <BpmDisplay bpm={m.bpm} onChange={m.setBpm} />
          </motion.div>

          <motion.div variants={rise}>
            <Pendulum
              bpm={m.bpm}
              onBpmChange={m.setBpm}
              playing={m.playing}
              getBeatPosition={m.getBeatPosition}
              onBeat={m.onBeat}
            />
          </motion.div>

          <motion.div variants={rise}>
            <BeatDots beatsPerBar={m.beatsPerBar} beat={m.beat} accent={m.accent} />
          </motion.div>

          <motion.div variants={rise} className="flex w-full items-center justify-between px-2">
            <TapButton onTap={tap} />
            <PlayButton playing={m.playing} onToggle={m.toggle} onBeat={m.onBeat} />
          </motion.div>

          <motion.div variants={rise} className="w-full">
            <SettingsCard
              beatsPerBar={m.beatsPerBar}
              onBeatsPerBarChange={m.setBeatsPerBar}
              accent={m.accent}
              onAccentChange={m.setAccent}
            />
          </motion.div>
        </main>

        <motion.footer variants={rise} className="hidden justify-center gap-5 pb-6 text-[12px] text-ink-soft sm:flex">
          <Hint keys={['space']} label="開始 / 停止" />
          <Hint keys={['↑', '↓']} label="テンポ ±1" />
          <Hint keys={['⇧', '↑↓']} label="±10" />
          <Hint keys={['T']} label="タップ" />
        </motion.footer>
      </motion.div>
    </div>
  );
}

function Hint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="chunky-sm min-w-7 rounded-lg bg-card px-2 py-0.5 text-center font-sans text-[11px] leading-5 font-black text-ink"
        >
          {k}
        </kbd>
      ))}
      <span className="ml-1">{label}</span>
    </span>
  );
}

/** App mark: a tiny pendulum in a coral bubble that wobbles hello on launch. */
function Logo() {
  return (
    <motion.span
      aria-hidden
      className="chunky-sm flex size-10 items-center justify-center rounded-2xl bg-coral [--edge:var(--color-coral-deep)]"
      initial={{ rotate: -20, scale: 0.5 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.6, duration: 0.8, delay: 0.15 }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24">
        <g transform="rotate(14 12 19)">
          <path d="M12 19V4" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <circle cx="12" cy="10" r="4" fill="var(--color-mustard)" />
        </g>
        <circle cx="12" cy="19" r="2.6" fill="#fff" />
      </svg>
    </motion.span>
  );
}

/** Soft candy-colored shapes drifting behind everything. */
function Blobs() {
  const blobs = [
    { className: 'bg-mint-pale -top-16 -right-20 size-56', y: [0, 14, 0], d: 7 },
    { className: 'bg-coral-pale top-[38%] -left-24 size-44', y: [0, -12, 0], d: 8 },
    { className: 'bg-mustard-pale -bottom-20 right-[-10%] size-64', y: [0, 10, 0], d: 9 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {blobs.map((b) => (
        <motion.span
          key={b.className}
          className={`absolute rounded-full ${b.className}`}
          animate={{ y: b.y }}
          transition={{ duration: b.d, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
