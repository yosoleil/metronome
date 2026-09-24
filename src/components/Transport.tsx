import { AnimatePresence, motion } from 'motion/react';

export function PlayButton({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={playing ? '停止' : '再生'}
      aria-pressed={playing}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`relative flex size-[76px] items-center justify-center rounded-full transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-4 focus-visible:ring-offset-ink focus-visible:outline-none ${
        playing
          ? 'border border-gold/50 bg-gold/10 text-gold shadow-[0_0_40px_-8px_rgb(220_191_138/0.5)]'
          : 'bg-zinc-50 text-ink shadow-[0_10px_40px_-10px_rgb(255_255_255/0.35)]'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={playing ? 'stop' : 'play'}
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 30 }}
          transition={{ duration: 0.16 }}
        >
          {playing ? <rect x="6" y="6" width="12" height="12" rx="2" /> : <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />}
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  );
}

const sideButton =
  'flex h-12 w-24 items-center justify-center rounded-full border text-[11px] font-semibold tracking-[0.28em] transition-colors focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:outline-none select-none touch-manipulation';

export function TapButton({ onTap }: { onTap: () => void }) {
  return (
    <motion.button
      type="button"
      onPointerDown={(e) => {
        // Register on press rather than release — taps should land exactly on the beat.
        if (e.button === 0) onTap();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!e.repeat) onTap();
        }
      }}
      data-tap
      aria-label="タップしてテンポを設定"
      whileTap={{ scale: 0.92, backgroundColor: 'rgba(255,255,255,0.1)' }}
      transition={{ duration: 0.08 }}
      className={`${sideButton} border-white/10 bg-white/[0.03] pl-[0.28em] text-zinc-300 hover:border-white/20 hover:text-white`}
    >
      TAP
    </motion.button>
  );
}

export function AccentToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="1拍目にアクセントを付ける"
      onClick={() => onChange(!on)}
      whileTap={{ scale: 0.94 }}
      className={`${sideButton} gap-2 pl-[0.28em] ${
        on ? 'border-gold/35 bg-gold/[0.07] text-gold' : 'border-white/10 bg-white/[0.03] text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <span className={`size-1.5 rounded-full transition-colors ${on ? 'bg-gold shadow-[0_0_8px_rgb(220_191_138/0.8)]' : 'bg-zinc-600'}`} />
      ACC
    </motion.button>
  );
}
