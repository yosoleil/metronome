import { useCallback, useEffect, useState } from 'react';
import { MetronomeEngine, type BeatEvent } from '../audio/MetronomeEngine.ts';
import { loadSettings, saveSettings } from '../lib/storage.ts';
import { clampBpm } from '../lib/tempo.ts';

export function useMetronome() {
  const [initial] = useState(() => loadSettings({ bpm: 120, beatsPerBar: 4, accent: true }));
  const [engine] = useState(() => new MetronomeEngine(clampBpm(initial.bpm), initial.beatsPerBar, initial.accent));

  const [bpm, setBpmState] = useState(clampBpm(initial.bpm));
  const [beatsPerBar, setBeatsState] = useState(initial.beatsPerBar);
  const [accent, setAccentState] = useState(initial.accent);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState<number | null>(null);

  useEffect(() => engine.subscribe((e) => setBeat(e.beat)), [engine]);
  useEffect(() => () => engine.stop(), [engine]);
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && engine.resumeIfNeeded();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [engine]);
  useEffect(() => saveSettings({ bpm, beatsPerBar, accent }), [bpm, beatsPerBar, accent]);

  const setBpm = useCallback(
    (update: number | ((prev: number) => number)) => {
      setBpmState((prev) => {
        const next = clampBpm(typeof update === 'function' ? update(prev) : update);
        engine.setBpm(next);
        return next;
      });
    },
    [engine],
  );

  const setBeatsPerBar = useCallback(
    (n: number) => {
      engine.setBeatsPerBar(n);
      setBeatsState(n);
    },
    [engine],
  );

  const setAccent = useCallback(
    (on: boolean) => {
      engine.setAccent(on);
      setAccentState(on);
    },
    [engine],
  );

  const toggle = useCallback(() => {
    if (engine.playing) {
      engine.stop();
      setPlaying(false);
      setBeat(null);
    } else {
      setPlaying(true);
      engine.start().catch(() => setPlaying(false));
    }
  }, [engine]);

  const onBeat = useCallback((fn: (e: BeatEvent) => void) => engine.subscribe(fn), [engine]);
  const getBeatPosition = useCallback(() => engine.getBeatPosition(), [engine]);

  return { bpm, setBpm, beatsPerBar, setBeatsPerBar, accent, setAccent, playing, toggle, beat, onBeat, getBeatPosition };
}
