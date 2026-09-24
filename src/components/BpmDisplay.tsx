import { tempoMarking } from '../lib/tempo.ts';
import { RollingNumber, SwapText } from './RollingNumber.tsx';
import { StepButton } from './StepButton.tsx';

type Props = { bpm: number; onChange: (update: number | ((prev: number) => number)) => void };

export function BpmDisplay({ bpm, onChange }: Props) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <StepButton label="テンポを下げる" onStep={() => onChange((b) => b - 1)}>
        <path d="M6 12h12" />
      </StepButton>

      <div className="flex flex-col items-center">
        <div aria-hidden className="flex items-baseline gap-1.5">
          <span className="text-[clamp(4.25rem,21vw,5.75rem)] leading-none font-black tracking-[-0.03em]">
            <RollingNumber value={bpm} />
          </span>
          <span className="text-[15px] font-black tracking-[0.06em] text-coral">BPM</span>
        </div>
        <div aria-hidden className="relative mt-2 flex h-7 items-center rounded-full bg-mustard-pale px-3.5 text-[14px] font-extrabold text-ink">
          <span className="mr-1.5 text-mustard-deep">♪</span>
          <SwapText text={tempoMarking(bpm)} />
        </div>
        <span className="sr-only">
          {bpm} BPM、{tempoMarking(bpm)}
        </span>
      </div>

      <StepButton label="テンポを上げる" onStep={() => onChange((b) => b + 1)}>
        <path d="M12 6v12M6 12h12" />
      </StepButton>
    </div>
  );
}
