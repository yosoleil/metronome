import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useEffect, useRef } from 'react';

// Each digit hops in from the direction the value moved and lands with a little bounce.
const roll: Variants = {
  enter: (dir: number) => ({ y: `${dir * 0.6}em`, scale: 0.5, opacity: 0 }),
  center: { y: 0, scale: 1, opacity: 1 },
  exit: (dir: number) => ({ y: `${dir * -0.6}em`, scale: 0.5, opacity: 0 }),
};
const bouncy = { type: 'spring', bounce: 0.45, duration: 0.45 } as const;

export function RollingNumber({ value, className = '' }: { value: number; className?: string }) {
  const prev = useRef(value);
  const dir = value >= prev.current ? 1 : -1;
  useEffect(() => {
    prev.current = value;
  }, [value]);

  const digits = String(value).split('');
  return (
    <motion.span layout transition={bouncy} className={`inline-flex tabular-nums ${className}`}>
      <AnimatePresence initial={false}>
        {digits.map((d, i) => (
          // Keyed by place value, so the ones column stays put when 99 becomes 100.
          <motion.span
            key={digits.length - i}
            layout
            className="relative inline-flex"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4, position: 'absolute' }}
            transition={bouncy}
          >
            <AnimatePresence initial={false} mode="popLayout" custom={dir}>
              <motion.span
                key={d}
                custom={dir}
                variants={roll}
                initial="enter"
                animate="center"
                exit="exit"
                transition={bouncy}
                className="inline-block"
              >
                {d}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.span>
  );
}

/** Pops short labels in and out when they change (tempo marking, button titles). */
export function SwapText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={text}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.12 } }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.45 }}
        className={`inline-block ${className}`}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}
