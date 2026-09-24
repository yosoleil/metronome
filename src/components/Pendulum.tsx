import { motion, useAnimate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { BeatEvent } from '../audio/MetronomeEngine.ts';
import { JELLY, squish } from '../lib/jelly.ts';
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
const PIVOT = { x: 150, y: 346 };
const ROD_LENGTH = 312;
/** Distance from the pivot to the weight's index line at the fastest / slowest tempo. */
const R_FAST = 72;
const R_SLOW = 282;
const WEIGHT_R = 25;
/** Right edge of the tempo scale (tick dots). */
const SCALE_X = 112;
const AMPLITUDE = 24;

// Rounded trapezoid: wide foot, narrow top.
const HOUSING = 'M54 386 Q30 386 35 362 L74 74 Q77 54 97 54 L203 54 Q223 54 226 74 L265 362 Q270 386 246 386 Z';

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

  // Beat effects: a puff at the pivot, a pop at the swing end just reached, and the weight goes "boing".
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
        flash(accent ? '[data-pivot-accent]' : '[data-pivot]', accent ? 0.9 : 0.7, 0, { scale: [0.6, 1.4] });
        if (!reduceMotion) {
          flash(`[data-end="${count % 2 === 0 ? 'right' : 'left'}"]`, 1, 0.25, { scale: [2, 1] });
          const body = scope.current?.querySelector('[data-weight-body]');
          if (body) squish(animate, body, accent ? 0.16 : 0.09);
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
    <div ref={scope} className="relative aspect-[3/4] h-[min(36svh,380px)] max-w-[92vw]">
      <svg
        ref={svgRef}
        viewBox="0 0 300 400"
        className="h-full w-full touch-none overflow-visible select-none"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Housing: a soft rounded slab with a solid "thickness" underneath. */}
        <path d={HOUSING} transform="translate(0 8)" style={{ fill: 'var(--pop-shadow)' }} />
        <path d={HOUSING} className="fill-card" />

        {/* Tempo scale: fat dots and chunky numbers; the one nearest the weight gets a coral bubble. */}
        <g aria-hidden>
          {SCALE_MINOR.map((m) => (
            <circle key={m} cx={SCALE_X} cy={PIVOT.y - radiusFor(m)} r={2} className="fill-ink-faint" />
          ))}
          {SCALE_LABELS.map((m) => {
            const y = PIVOT.y - radiusFor(m);
            const near = Math.abs(m - bpm) / bpm < 0.06;
            return (
              <g key={m}>
                <circle cx={SCALE_X} cy={y} r={3.5} className={`transition-colors duration-300 ${near ? 'fill-coral' : 'fill-ink-faint'}`} />
                <motion.rect
                  x={SCALE_X - 46}
                  y={y - 9}
                  width={34}
                  height={18}
                  rx={9}
                  className="fill-coral"
                  initial={false}
                  animate={{ opacity: near ? 1 : 0, scale: near ? 1 : 0.4 }}
                  transition={JELLY}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                />
                <text
                  x={SCALE_X - 29}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11.5"
                  className={`font-sans font-black tabular-nums transition-[fill] duration-300 ${near ? 'fill-white' : 'fill-ink-soft'}`}
                >
                  {m}
                </text>
              </g>
            );
          })}
        </g>

        {/* Swing path (a row of dots) and its two ends, which pop when the rod arrives on the beat */}
        <path
          d={`M${PIVOT.x - endX} ${endY} A${ROD_LENGTH} ${ROD_LENGTH} 0 0 1 ${PIVOT.x + endX} ${endY}`}
          fill="none"
          className="stroke-ink-faint"
          strokeDasharray="0 13"
          strokeLinecap="round"
          strokeWidth={5}
        />
        {(['left', 'right'] as const).map((side) => (
          <circle
            key={side}
            data-end={side}
            cx={PIVOT.x + (side === 'left' ? -endX : endX)}
            cy={endY}
            r={7}
            className="fill-coral"
            opacity={0.25}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          />
        ))}

        {/* Pivot puffs */}
        <circle data-pivot cx={PIVOT.x} cy={PIVOT.y} r={34} className="fill-mint" opacity={0} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        <circle data-pivot-accent cx={PIVOT.x} cy={PIVOT.y} r={44} className="fill-coral" opacity={0} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />

        {/* Rod, tip and sliding weight */}
        <g ref={rodRef}>
          <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2={PIVOT.y - ROD_LENGTH} className="stroke-coral" strokeWidth={13} strokeLinecap="round" />
          <circle cx={PIVOT.x} cy={PIVOT.y - ROD_LENGTH} r={10} className="fill-mint" />

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
            <rect x={-52} y={-38} width={104} height={76} fill="transparent" />
            <circle className="weight-ring stroke-mustard" r={WEIGHT_R + 8} fill="none" strokeWidth={4} opacity={0} />
            {/* Pointer that reads off the scale */}
            <path d={`M${-WEIGHT_R - 9} 0 L${-WEIGHT_R + 2} -7 L${-WEIGHT_R + 2} 7 Z`} className="fill-mustard-deep" strokeLinejoin="round" stroke="var(--color-mustard-deep)" strokeWidth={4} />
            <motion.g animate={{ scale: dragging ? 1.15 : 1 }} transition={JELLY}>
              <g data-weight-body style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <circle cy={5} r={WEIGHT_R} className="fill-mustard-deep" />
                <circle r={WEIGHT_R} className="fill-mustard" />
                {/* Face */}
                <ellipse cx={-8} cy={-2} rx={3} ry={dragging ? 1.2 : 3.6} className="fill-cocoa transition-all duration-150" />
                <ellipse cx={8} cy={-2} rx={3} ry={dragging ? 1.2 : 3.6} className="fill-cocoa transition-all duration-150" />
                <ellipse cx={-14} cy={6} rx={3.6} ry={2.2} className="fill-coral" opacity={0.55} />
                <ellipse cx={14} cy={6} rx={3.6} ry={2.2} className="fill-coral" opacity={0.55} />
                <path d={dragging ? 'M-5 6 Q0 12 5 6 Z' : 'M-5 6 Q0 10 5 6'} className="stroke-cocoa" fill={dragging ? 'var(--color-cocoa)' : 'none'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                <ellipse cx={-10} cy={-15} rx={5} ry={3} fill="#fff" opacity={0.55} transform="rotate(-30 -10 -15)" />
              </g>
            </motion.g>
          </g>
        </g>

        {/* Pivot cap */}
        <circle cx={PIVOT.x} cy={PIVOT.y + 3} r={15} className="fill-mint-deep" />
        <circle cx={PIVOT.x} cy={PIVOT.y} r={15} className="fill-mint" />
        <circle cx={PIVOT.x} cy={PIVOT.y} r={5} className="fill-card" />
      </svg>
    </div>
  );
}
