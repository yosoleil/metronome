export type BeatEvent = {
  /** 0-based position within the bar. */
  beat: number;
  /** Running beat number since start; its parity tells which way the pendulum is swinging. */
  count: number;
  accent: boolean;
  /** Seconds between this beat and the next, at the tempo it was scheduled with. */
  interval: number;
};

type ScheduledBeat = BeatEvent & { time: number };

/** How often the scheduler wakes up. */
const LOOKAHEAD_MS = 25;
/** How far ahead of the audio clock clicks are scheduled. Must comfortably exceed LOOKAHEAD_MS. */
const SCHEDULE_AHEAD_S = 0.12;
/** Small delay before the first click so it is never scheduled in the past. */
const START_DELAY_S = 0.06;

/**
 * Sample-accurate metronome built on the "two clocks" pattern:
 * a coarse JS timer refills a short queue, and every click is placed on the AudioContext timeline
 * with `start(time)`. Visual beat events are released on requestAnimationFrame when the audio
 * output clock reaches each click, so the pulse lines up with what is actually heard.
 */
export class MetronomeEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /** Per-run bus; disconnecting it silences clicks already queued when stopping. */
  private bus: GainNode | null = null;
  private worker: Worker | null = null;
  private rafId = 0;

  private nextNoteTime = 0;
  private beatIndex = 0;
  private scheduledCount = 0;
  private startTime = 0;
  private pending: ScheduledBeat[] = [];
  private lastHeard: ScheduledBeat | null = null;
  private listeners = new Set<(e: BeatEvent) => void>();

  private _playing = false;

  constructor(
    private bpm: number,
    private beatsPerBar: number,
    private accent: boolean,
  ) {}

  get playing() {
    return this._playing;
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  setBeatsPerBar(n: number) {
    this.beatsPerBar = n;
    if (this.beatIndex >= n) this.beatIndex = 0;
  }

  setAccent(on: boolean) {
    this.accent = on;
  }

  subscribe(fn: (e: BeatEvent) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  async start() {
    if (this._playing) return;
    this._playing = true;

    if (!this.ctx) {
      // iOS Safari 16.4+: play through the ringer/silent switch like a media app, not like a UI sound.
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session) session.type = 'playback';
      this.ctx = new AudioContext({ latencyHint: 'interactive' });
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);
    }
    // Must be called from a user gesture on the first run (autoplay policy).
    await this.ctx.resume();
    if (!this._playing) return; // stopped while resuming

    this.bus = this.ctx.createGain();
    this.bus.connect(this.master!);

    this.beatIndex = 0;
    this.scheduledCount = 0;
    this.pending = [];
    this.lastHeard = null;
    this.startTime = this.ctx.currentTime;
    this.nextNoteTime = this.startTime + START_DELAY_S;
    this.schedule();

    if (!this.worker) {
      this.worker = new Worker(new URL('./ticker.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = () => this.schedule();
    }
    this.worker.postMessage({ type: 'start', interval: LOOKAHEAD_MS });
    this.rafId = requestAnimationFrame(this.dispatch);
  }

  stop() {
    if (!this._playing) return;
    this._playing = false;
    this.worker?.postMessage({ type: 'stop' });
    cancelAnimationFrame(this.rafId);
    this.pending = [];
    this.bus?.disconnect();
    this.bus = null;
  }

  /** Mobile browsers suspend audio in the background; call when the page becomes visible again. */
  resumeIfNeeded() {
    if (this._playing && this.ctx && this.ctx.state !== 'running') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Continuous beat position on the heard-audio clock: an integer exactly when a click is heard,
   * fractional in between. Before the first click it runs from -0.5 up to 0 (the pre-roll).
   * `null` when stopped.
   */
  getBeatPosition(): number | null {
    const ctx = this.ctx;
    if (!ctx || !this._playing) return null;
    const heard = this.heardTime();
    const next = this.pending.find((b) => b.time > heard);
    const last = this.lastHeard && this.lastHeard.time <= heard ? this.lastHeard : null;

    if (!last) {
      const first = next?.time ?? this.startTime + START_DELAY_S;
      const p = (heard - this.startTime) / Math.max(first - this.startTime, 1e-3);
      return -0.5 + 0.5 * Math.min(Math.max(p, 0), 1);
    }
    const span = next ? next.time - last.time : last.interval;
    return last.count + Math.min((heard - last.time) / span, 1);
  }

  dispose() {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
  }

  /** contextTime of the sample currently leaving the speakers (accounts for output latency). */
  private heardTime() {
    const ctx = this.ctx!;
    const t = ctx.getOutputTimestamp?.().contextTime;
    // Some browsers report 0 until output starts; fall back to the render clock.
    return t && t > 0 ? t : ctx.currentTime;
  }

  private schedule = () => {
    const ctx = this.ctx;
    if (!ctx || !this._playing) return;

    // If the tab was suspended long enough to fall behind, resync instead of firing a burst of clicks.
    if (this.nextNoteTime < ctx.currentTime) {
      this.nextNoteTime = ctx.currentTime + START_DELAY_S;
    }

    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const interval = 60 / this.bpm;
      const accent = this.accent && this.beatIndex === 0 && this.beatsPerBar > 1;
      this.playClick(this.nextNoteTime, accent);
      this.pending.push({ time: this.nextNoteTime, beat: this.beatIndex, count: this.scheduledCount++, accent, interval });

      this.nextNoteTime += interval;
      this.beatIndex = (this.beatIndex + 1) % this.beatsPerBar;
    }
  };

  private playClick(time: number, accent: boolean) {
    const ctx = this.ctx!;
    const freq = accent ? 1760 : 1320;
    const peak = accent ? 0.9 : 0.55;

    // A short sine "ping" with a quick downward pitch glide reads as a clean, woody tick.
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.012);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(peak, time + 0.0015);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);

    osc.connect(env).connect(this.bus!);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  private dispatch = () => {
    const ctx = this.ctx;
    if (!ctx || !this._playing) return;

    const heardTime = this.heardTime();

    while (this.pending.length && this.pending[0].time <= heardTime) {
      const beat = this.pending.shift()!;
      this.lastHeard = beat;
      const { time: _time, ...event } = beat;
      // Skip stale beats (e.g. after the tab was hidden) so the UI doesn't replay a backlog.
      if (this.pending.length && this.pending[0].time <= heardTime) continue;
      for (const fn of this.listeners) fn(event);
    }
    this.rafId = requestAnimationFrame(this.dispatch);
  };
}
