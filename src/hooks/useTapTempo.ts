import { useCallback, useRef } from 'react';

/** Taps further apart than this start a new measurement. */
const RESET_MS = 2000;
const MAX_TAPS = 6;

/** Returns a `tap()` function; calls `onTempo` with the averaged BPM once there are at least two taps. */
export function useTapTempo(onTempo: (bpm: number) => void) {
  const taps = useRef<number[]>([]);

  return useCallback(() => {
    const now = performance.now();
    const list = taps.current;
    if (list.length && now - list[list.length - 1] > RESET_MS) list.length = 0;
    list.push(now);
    if (list.length > MAX_TAPS) list.shift();
    if (list.length >= 2) {
      const avg = (list[list.length - 1] - list[0]) / (list.length - 1);
      onTempo(60000 / avg);
    }
  }, [onTempo]);
}
