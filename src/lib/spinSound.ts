/**
 * Lightweight WebAudio "tick" for the topic spin animation.
 * No external audio file — synthesized on the fly so it stays
 * subtle and depends only on the browser's audio context.
 */

let ctx: AudioContext | null = null;
let unlocked = false;
let muted = false;

function getContext(): AudioContext | null {
  if (muted) return null;
  if (typeof window === 'undefined') return null;
  const Ctor =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

/**
 * Must be called inside the user-gesture handler (e.g. the click on Spin)
 * so that audio playback is permitted by autoplay restrictions.
 */
export function unlockSpinAudio() {
  if (unlocked) return;
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume().catch(() => {
      /* ignore */
    });
  }
  unlocked = true;
}

/**
 * Play a short, soft "tick".
 * `intensity` is in [0..1] — 1 is full volume at fast spin, fading down as
 * the animation slows. `pitch` lets us nudge the frequency so each tick
 * feels slightly different from the last.
 */
export function playSpinTick(intensity = 1, pitch = 1) {
  const c = getContext();
  if (!c || !unlocked) return;
  if (c.state === 'suspended') {
    c.resume().catch(() => {
      /* ignore */
    });
  }
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = 'triangle';
  // Soft mid-range click; pitch lets the cadence feel varied
  const baseFreq = 540 * pitch;
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(120, baseFreq * 0.55), now + 0.06);

  const vol = Math.max(0, Math.min(1, intensity)) * 0.08;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

/** Play a tiny "land" sound — a soft double-thump on final selection. */
export function playSpinLand() {
  const c = getContext();
  if (!c || !unlocked) return;
  const now = c.currentTime;
  const makeBloop = (freq: number, startOffset: number) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + startOffset);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + startOffset + 0.18);
    gain.gain.setValueAtTime(0, now + startOffset);
    gain.gain.linearRampToValueAtTime(0.07, now + startOffset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + 0.22);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + 0.25);
  };
  makeBloop(360, 0);
  makeBloop(540, 0.08);
}

export function setSpinAudioMuted(value: boolean) {
  muted = value;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}