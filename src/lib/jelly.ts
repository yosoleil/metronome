import type { AnimationScope, DOMKeyframesDefinition, useAnimate } from 'motion/react';

/** The house spring: overshoots once or twice and settles, like a soft gummy. */
export const JELLY = { type: 'spring', bounce: 0.5, duration: 0.5 } as const;

/** Pressed state for chunky buttons: sink onto the slab and splay out a little. */
export const PRESS = { y: 4, scaleX: 1.07, scaleY: 0.9 } as const;

type Animate = ReturnType<typeof useAnimate>[1];

/**
 * Squash-and-stretch: flatten quickly, then spring back and wobble.
 * `amount` is how far it squashes (0.12 = 12% wider, 12% shorter).
 */
export function squish(animate: Animate, target: string | Element | AnimationScope, amount = 0.12, extra: DOMKeyframesDefinition = {}) {
  const t = target as Element;
  animate(t, { scaleX: 1 + amount, scaleY: 1 - amount, ...extra }, { duration: 0.07, ease: 'easeOut' }).then(() =>
    animate(t, { scaleX: 1, scaleY: 1 }, { type: 'spring', bounce: 0.6, duration: 0.55 }),
  );
}
