// Remembers the last settings per browser. Storage can be unavailable (private mode etc.), so every access is guarded.
const KEY = 'metronome:settings';

export type Settings = { bpm: number; beatsPerBar: number; accent: boolean };

export function loadSettings(fallback: Settings): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<Settings>) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}
