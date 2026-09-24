import { useEffect } from 'react';

/** Keeps the screen on while `active` — a phone that dims mid-practice would also suspend the audio. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = () =>
      navigator.wakeLock
        .request('screen')
        .then((s) => {
          if (cancelled) s.release();
          else sentinel = s;
        })
        .catch(() => {});

    // The lock is dropped automatically when the page is hidden; take it again on return.
    const onVisible = () => document.visibilityState === 'visible' && request();

    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
