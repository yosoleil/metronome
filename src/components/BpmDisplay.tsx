import { tempoMarking } from '../lib/tempo.ts';
import { StepButton } from './StepButton.tsx';

// DSEG treats "!" as a blank the width of a digit, which keeps 2- and 3-digit tempos aligned
// over the unlit "888" segments.
const pad = (bpm: number) => String(bpm).padStart(3, '!');

type Props = { bpm: number; onChange: (update: number | ((prev: number) => number)) => void };

export function BpmDisplay({ bpm, onChange }: Props) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <StepButton label="テンポを1下げる" onStep={() => onChange((b) => b - 1)}>
        <path d="M5 12h14" />
      </StepButton>

      <div className="flex flex-col items-center">
        <div className="relative font-digital text-[clamp(3rem,15vw,4.75rem)] leading-none tracking-tight">
          <span aria-hidden className="text-white/[0.045]">
            888
          </span>
          <span aria-hidden className="absolute inset-0 text-zinc-50 [text-shadow:0_0_24px_rgb(255_255_255/0.18)]">
            {pad(bpm)}
          </span>
          <span className="sr-only">
            {bpm} BPM
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-medium tracking-[0.32em] text-zinc-500">
          <span>BPM</span>
          <span className="size-0.5 rounded-full bg-zinc-600" />
          <span className="text-gold/90 italic tracking-[0.18em]">{tempoMarking(bpm)}</span>
        </div>
      </div>

      <StepButton label="テンポを1上げる" onStep={() => onChange((b) => b + 1)}>
        <path d="M12 5v14M5 12h14" />
      </StepButton>
    </div>
  );
}
