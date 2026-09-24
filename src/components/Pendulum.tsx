import { useAnimate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { BeatEvent } from '../audio/MetronomeEngine.ts';
import {
  MAX_BPM,
  MIN_BPM,
  SCALE_LABELS,
  SCALE_MINOR,
  bpmToRodPosition,
  clampBpm,
  rodPositionToBpm,
  tempoMarking,
} from '../lib/tempo.ts';

// Geometry in SVG user units (viewBox 0 0 300 400).
const PIVOT = { x: 150, y: 350 };
const ROD_LENGTH = 316;
/** Distance from the pivot to the weight's index line at the fastest / slowest tempo. */
const R_FAST = 76;
const R_SLOW = 290;
const AMPLITUDE = 24;

const radiusFor = (bpm: number) => R_FAST + bpmToRodPosition(bpm) * (R_SLOW - R_FAST);
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

type Props = {
  bpm: number;
  onBpmChange: (update: number | ((prev: number) => number)) => void;
  playing: boolean;
  getBeatPosition: () => number | null;
  onBeat: (fn: (e: BeatEvent) => void) => () => void;
};

export function Pendulum({ bpm, onBpmChange, playing, getBeatPosition, onBeat }: Props) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const rodRef = useRef<SVGGElement>(null);
  const angleRef = useRef(0);
  const dragOffset = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const reduceMotion = useReducedMotion();

  // Swing: angle is a pure function of the audio-clock beat position, so it can't drift from the sound.
  // An extreme is reached exactly on each click; cos() gives a pendulum's natural slow-at-the-ends motion.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const pos = reduceMotion ? null : getBeatPosition();
      angleRef.current = pos === null ? angleRef.current * 0.86 : AMPLITUDE * Math.cos(Math.PI * pos);
      if (pos === null && Math.abs(angleRef.current) < 0.02) angleRef.current = 0;
      rodRef.current?.setAttribute('transform', `rotate(${angleRef.current} ${PIVOT.x} ${PIVOT.y})`);
      if (pos !== null || angleRef.current !== 0) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduceMotion, getBeatPosition]);

  // Beat flashes: pivot glow, the swing end that was just reached, and a glint on the weight.
  useEffect(
    () =>
      onBeat(({ accent, count, interval }) => {
        const fade = { duration: Math.min(Math.max(interval * 1.1, 0.25), 0.9), ease: EASE_OUT };
        // animate() applies its first keyframe on the next frame; light up synchronously so the flash
        // lands in the same frame the rod reaches the end of its swing, then let motion fade it out.
        const flash = (selector: string, peak: number, rest: number, extra?: { scale: number[] }) => {
          scope.current?.querySelectorAll<SVGElement>(selector).forEach((el) => {
            el.style.opacity = String(peak);
            if (extra) el.style.transform = `scale(${extra.scale[0]})`;
          });
          animate(selector, { opacity: [peak, rest], ...extra }, fade);
        };
        flash(accent ? '[data-pivot-accent]' : '[data-pivot]', 1, 0);
        flash('[data-weight-glint]', accent ? 1 : 0.55, 0);
        if (!reduceMotion) {
          flash(`[data-end="${count % 2 === 0 ? 'right' : 'left'}"]`, 1, 0.15, { scale: [1.8, 1] });
        }
      }),
    [onBeat, animate, scope, reduceMotion],
  );

  const pointerRadius = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
    // Distance from the pivot works whatever angle the rod is at, so the weight can be moved mid-swing.
    return Math.hypot(pt.x - PIVOT.x, pt.y - PIVOT.y);
  };

  const onPointerDown = (e: React.PointerEvent<SVGGElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    svgRef.current!.setPointerCapture(e.pointerId);
    (e.currentTarget as SVGGElement).focus({ preventScroll: true });
    dragOffset.current = pointerRadius(e) - radiusFor(bpm);
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragOffset.current === null) return;
    const r = Math.min(Math.max(pointerRadius(e) - dragOffset.current, R_FAST), R_SLOW);
    const next = clampBpm(rodPositionToBpm((r - R_FAST) / (R_SLOW - R_FAST)));
    onBpmChange((prev) => {
      // A light detent on devices that support it, whenever the weight crosses a scale mark.
      const crossed = SCALE_LABELS.some((m) => (prev < m) !== (next < m) || m === next);
      if (crossed && prev !== next) navigator.vibrate?.(5);
      return next;
    });
  };

  const endDrag = () => {
    dragOffset.current = null;
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const steps: Record<string, (b: number) => number> = {
      ArrowUp: (b) => b + 1,
      ArrowRight: (b) => b + 1,
      ArrowDown: (b) => b - 1,
      ArrowLeft: (b) => b - 1,
      PageUp: (b) => b + 10,
      PageDown: (b) => b - 10,
      Home: () => MIN_BPM,
      End: () => MAX_BPM,
    };
    const step = steps[e.key];
    if (!step) return;
    e.preventDefault();
    e.stopPropagation();
    onBpmChange(e.shiftKey && e.key.startsWith('Arrow') ? (b) => b + (step(b) - b) * 10 : step);
  };

  const weightY = PIVOT.y - radiusFor(bpm);
  const swingRad = (AMPLITUDE * Math.PI) / 180;
  const endX = ROD_LENGTH * Math.sin(swingRad);
  const endY = PIVOT.y - ROD_LENGTH * Math.cos(swingRad);

  return (
    <div ref={scope} className="relative aspect-[3/4] h-[min(42svh,400px)] max-w-[92vw]">
      <svg
        ref={svgRef}
        viewBox="0 0 300 400"
        className="h-full w-full touch-none overflow-visible select-none"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <defs>
          <linearGradient id="housing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.035" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.01" />
          </linearGradient>
          {/* userSpaceOnUse: a vertical line has a zero-width bounding box, so a bbox-relative gradient wouldn't render. */}
          <linearGradient id="rod" gradientUnits="userSpaceOnUse" x1="0" y1={PIVOT.y - ROD_LENGTH} x2="0" y2={PIVOT.y}>
            <stop offset="0" stopColor="#fafafa" stopOpacity="0.95" />
            <stop offset="1" stopColor="#a1a1aa" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4f4f5" />
            <stop offset="0.45" stopColor="#a8a29e" />
            <stop offset="1" stopColor="#44403c" />
          </linearGradient>
          <radialGradient id="glow-white">
            <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-gold">
            <stop offset="0" stopColor="#dcbf8a" stopOpacity="0.85" />
            <stop offset="1" stopColor="#dcbf8a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Housing and tempo scale */}
        <path d="M40 392 L260 392 L194 70 L106 70 Z" fill="url(#housing)" stroke="rgb(255 255 255 / 0.07)" strokeLinejoin="round" />
        <g aria-hidden>
          {SCALE_MINOR.map((m) => {
            const y = PIVOT.y - radiusFor(m);
            return <line key={m} x1={124} x2={128} y1={y} y2={y} stroke="rgb(255 255 255 / 0.14)" />;
          })}
          {SCALE_LABELS.map((m) => {
            const y = PIVOT.y - radiusFor(m);
            const near = Math.abs(m - bpm) / bpm < 0.06;
            return (
              <g key={m}>
                <line x1={120} x2={128} y1={y} y2={y} stroke={near ? '#dcbf8a' : 'rgb(255 255 255 / 0.25)'} />
                <text
                  x={116}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontSize="9"
                  letterSpacing="0.5"
                  fill={near ? '#dcbf8a' : 'rgb(255 255 255 / 0.32)'}
                  className="font-sans tabular-nums transition-[fill] duration-300"
                >
                  {m}
                </text>
              </g>
            );
          })}
        </g>

        {/* Swing path and its two ends, which light up when the rod arrives on the beat */}
        <path
          d={`M${PIVOT.x - endX} ${endY} A${ROD_LENGTH} ${ROD_LENGTH} 0 0 1 ${PIVOT.x + endX} ${endY}`}
          fill="none"
          stroke="rgb(255 255 255 / 0.06)"
          strokeDasharray="1 5"
          strokeLinecap="round"
        />
        {(['left', 'right'] as const).map((side) => (
          <circle
            key={side}
            data-end={side}
            cx={PIVOT.x + (side === 'left' ? -endX : endX)}
            cy={endY}
            r={3}
            fill="#dcbf8a"
            opacity={0.15}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}

        {/* Pivot glows */}
        <circle data-pivot cx={PIVOT.x} cy={PIVOT.y} r={46} fill="url(#glow-white)" opacity={0} />
        <circle data-pivot-accent cx={PIVOT.x} cy={PIVOT.y} r={62} fill="url(#glow-gold)" opacity={0} />

        {/* Rod, tip and sliding weight */}
        <g ref={rodRef}>
          <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2={PIVOT.y - ROD_LENGTH} stroke="url(#rod)" strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={PIVOT.x} cy={PIVOT.y - ROD_LENGTH} r={3.2} fill="#fafafa" />

          <g
            role="slider"
            tabIndex={0}
            aria-label="テンポ（おもりを上下にスライド）"
            aria-orientation="vertical"
            aria-valuemin={MIN_BPM}
            aria-valuemax={MAX_BPM}
            aria-valuenow={bpm}
            aria-valuetext={`${bpm} BPM ${tempoMarking(bpm)}`}
            onPointerDown={onPointerDown}
            onKeyDown={onKeyDown}
            transform={`translate(${PIVOT.x} ${weightY})`}
            className={`weight outline-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            {/* Generous invisible hit area for fingers */}
            <rect x={-48} y={-30} width={96} height={60} fill="transparent" />
            <rect className="weight-ring" x={-31} y={-19} width={62} height={38} rx={9} fill="none" stroke="#dcbf8a" strokeOpacity={0.7} opacity={0} />
            <ellipse cx={0} cy={4} rx={40} ry={24} fill="url(#glow-gold)" opacity={dragging ? 0.55 : 0} className="transition-opacity duration-200" />
            <circle data-weight-glint cx={0} cy={0} r={34} fill="url(#glow-white)" opacity={0} />
            <path
              d="M-17 -13 H17 Q19 -13 19.6 -11 L24 11 Q24.4 13 22 13 H-22 Q-24.4 13 -24 11 L-19.6 -11 Q-19 -13 -17 -13 Z"
              fill="url(#metal)"
              stroke="rgb(255 255 255 / 0.35)"
              strokeWidth={0.6}
              style={{ filter: 'drop-shadow(0 4px 6px rgb(0 0 0 / 0.6))' }}
              transform={dragging ? 'scale(1.08)' : undefined}
              className="transition-transform duration-150"
            />
            {/* Index line: the tempo is read where this meets the scale */}
            <line x1={-31} x2={24} y1={0} y2={0} stroke="#b89a66" strokeWidth={1.4} strokeLinecap="round" />
          </g>
        </g>

        {/* Pivot cap */}
        <circle cx={PIVOT.x} cy={PIVOT.y} r={8} fill="#18181b" stroke="rgb(255 255 255 / 0.18)" />
        <circle cx={PIVOT.x} cy={PIVOT.y} r={2.4} fill="#dcbf8a" />
      </svg>
    </div>
  );
}
