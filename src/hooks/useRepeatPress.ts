import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

const INITIAL_DELAY = 380;
const START_INTERVAL = 110;
const MIN_INTERVAL = 30;

/**
 * Click fires once (mouse, touch, or keyboard); press-and-hold repeats with acceleration.
 * The click that ends a hold is swallowed so the action doesn't fire one extra time.
 */
export function useRepeatPress(action: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const repeated = useRef(false);
  const actionRef = useRef(action);
  useLayoutEffect(() => {
    actionRef.current = action;
  });

  const stop = useCallback(() => clearTimeout(timer.current), []);
  useEffect(() => stop, [stop]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      repeated.current = false;
      let interval = START_INTERVAL;
      const loop = () => {
        repeated.current = true;
        actionRef.current();
        interval = Math.max(MIN_INTERVAL, interval * 0.88);
        timer.current = setTimeout(loop, interval);
      };
      timer.current = setTimeout(loop, INITIAL_DELAY);
    },
    [],
  );

  const onClick = useCallback(() => {
    if (repeated.current) {
      repeated.current = false;
      return;
    }
    actionRef.current();
  }, []);

  return { onPointerDown, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop, onClick };
}
