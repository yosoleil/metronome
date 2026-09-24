import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { BeatDots } from './components/BeatDots.tsx';
import { BeatsSelector } from './components/BeatsSelector.tsx';
import { BpmDisplay } from './components/BpmDisplay.tsx';
import { Pendulum } from './components/Pendulum.tsx';
import { AccentToggle, PlayButton, TapButton } from './components/Transport.tsx';
import { useMetronome } from './hooks/useMetronome.ts';
import { useTapTempo } from './hooks/useTapTempo.ts';
import { useWakeLock } from './hooks/useWakeLock.ts';

export default function App() {
  const m = useMetronome();
  const tap = useTapTempo(m.setBpm);
  useWakeLock(m.playing);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;

      if (e.code === 'Space') {
        // Space is always play/stop, like a DAW — except on TAP, which uses it to tap.
        if (target.closest('[data-tap]')) return;
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
    <div className="grain relative flex min-h-dvh flex-col overflow-hidden">
      {/* Ambient light from above */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] [background:radial-gradient(60%_60%_at_50%_0%,rgb(220_191_138/0.07),transparent)]"
      />

      <header className="relative flex items-center justify-between px-6 pt-6 sm:px-10">
        <span className="text-[11px] font-semibold tracking-[0.42em] text-zinc-400">METRONOME</span>
        <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em]" aria-live="polite">
          <motion.span
            className="size-1.5 rounded-full"
            animate={{ backgroundColor: m.playing ? '#dcbf8a' : '#3f3f46', scale: m.playing ? [1, 1.4, 1] : 1 }}
            transition={m.playing ? { scale: { duration: 1.6, repeat: Infinity } } : { duration: 0.3 }}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={m.playing ? 'on' : 'off'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className={m.playing ? 'text-gold' : 'text-zinc-600'}
            >
              {m.playing ? 'PLAYING' : 'READY'}
            </motion.span>
          </AnimatePresence>
        </span>
      </header>

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-[clamp(0.9rem,2.6svh,1.75rem)] px-6 py-[clamp(0.5rem,2svh,1.5rem)]">
        <BpmDisplay bpm={m.bpm} onChange={m.setBpm} />

        <Pendulum
          bpm={m.bpm}
          onBpmChange={m.setBpm}
          playing={m.playing}
          getBeatPosition={m.getBeatPosition}
          onBeat={m.onBeat}
        />

        <BeatDots beatsPerBar={m.beatsPerBar} beat={m.beat} accent={m.accent} />

        <div className="flex w-full items-center justify-between">
          <TapButton onTap={tap} />
          <PlayButton playing={m.playing} onToggle={m.toggle} />
          <AccentToggle on={m.accent} onChange={m.setAccent} />
        </div>

        <BeatsSelector value={m.beatsPerBar} onChange={m.setBeatsPerBar} />
      </main>

      <footer className="relative hidden justify-center gap-6 pb-6 text-[11px] text-zinc-600 sm:flex">
        <Hint keys={['Space']} label="再生 / 停止" />
        <Hint keys={['↑', '↓']} label="±1" />
        <Hint keys={['Shift', '↑↓']} label="±10" />
        <Hint keys={['T']} label="タップ" />
      </footer>
    </div>
  );
}

function Hint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {keys.map((k) => (
        <kbd key={k} className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-sans text-[10px] text-zinc-400">
          {k}
        </kbd>
      ))}
      <span className="ml-0.5">{label}</span>
    </span>
  );
}
