export const MIN_BPM = 30;
export const MAX_BPM = 300;

export const clampBpm = (v: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(v)));

const MARKINGS: [maxBpm: number, name: string][] = [
  [39, 'Grave'],
  [59, 'Largo'],
  [65, 'Larghetto'],
  [75, 'Adagio'],
  [107, 'Andante'],
  [119, 'Moderato'],
  [155, 'Allegro'],
  [175, 'Vivace'],
  [199, 'Presto'],
  [Infinity, 'Prestissimo'],
];

export const tempoMarking = (bpm: number) => MARKINGS.find(([max]) => bpm <= max)![1];

/**
 * Weight position along the pendulum rod: 0 = nearest the pivot (fastest), 1 = top (slowest).
 * Logarithmic, like the scale on a mechanical metronome, so slow tempos get more room.
 */
export const bpmToRodPosition = (bpm: number) => 1 - Math.log(bpm / MIN_BPM) / Math.log(MAX_BPM / MIN_BPM);
export const rodPositionToBpm = (p: number) => MIN_BPM * (MAX_BPM / MIN_BPM) ** (1 - p);

export const SCALE_LABELS = [40, 60, 80, 100, 120, 144, 176, 208, 240, 300];
export const SCALE_MINOR = [30, 50, 70, 90, 110, 132, 160, 192, 270];
