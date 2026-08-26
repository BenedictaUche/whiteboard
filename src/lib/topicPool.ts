import type { Topic, Track } from '../types';
import { getTopicsForTrack, pickRandomTopic } from '../data/questions';
import { requestTopicPool, type GeneratedTopic, AIUnavailableError } from './api';

export interface CachedPool {
  /** The active list the spinner picks from (AI + fallback merged). */
  topics: Topic[];
  /** Raw AI-generated pool we still have left to introduce. */
  aiRemaining: Topic[];
  /** Source track for diagnostics. */
  track: Track;
}

const POOL_TARGET = 10;
const FALLBACK_POOL_CAP = 30;

const sessionCache = new Map<Track, CachedPool>();
let inflight: Promise<CachedPool | null> | null = null;

function safeStorageGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore quota / disabled storage */
  }
}

function difficultyFromGenerated(d: GeneratedTopic['difficulty']): Topic['diff'] {
  return d;
}

function researchTimeFor(difficulty: Topic['diff']): number {
  switch (difficulty) {
    case 'Beginner':
      return 5;
    case 'Intermediate':
      return 10;
    case 'Hard':
      return 12;
  }
}

function presentationTimeFor(difficulty: Topic['diff']): number {
  switch (difficulty) {
    case 'Beginner':
      return 2;
    case 'Intermediate':
      return 3;
    case 'Hard':
      return 4;
  }
}

function aiTopicToTopic(t: GeneratedTopic, track: Track, idx: number): Topic {
  return {
    id: `ai-${track}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1e6)}`,
    title: t.title,
    diff: difficultyFromGenerated(t.difficulty),
    res: `${researchTimeFor(t.difficulty)} min research`,
    pres: `${presentationTimeFor(t.difficulty)} min presentation`,
    category: track,
    hint: 'AI-generated interview topic — explore any angle that helps you explain it well.',
    expectedConcepts: Array.isArray(t.expectedConcepts) ? t.expectedConcepts : undefined,
    researchTime: researchTimeFor(t.difficulty),
    presentationTime: presentationTimeFor(t.difficulty),
  };
}

function fallbackTrackTopics(track: Track): Topic[] {
  return getTopicsForTrack(track);
}

function cacheKey(track: Track): string {
  return `Whiteboard_topics_${track}`;
}

function persistCache(track: Track, pool: CachedPool) {
  const slim = pool.aiRemaining.map((t) => ({
    title: t.title,
    diff: t.diff,
    expectedConcepts: t.expectedConcepts,
  }));
  safeStorageSet(cacheKey(track), JSON.stringify({ topics: slim }));
}

function readPersistedAi(track: Track): GeneratedTopic[] {
  const raw = safeStorageGet(cacheKey(track));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.topics)) return parsed.topics as GeneratedTopic[];
    return [];
  } catch {
    return [];
  }
}

function buildPoolFromAi(ai: GeneratedTopic[], track: Track, priorAiRemaining: Topic[]): CachedPool {
  const newAiTopics = ai.map((t, idx) => aiTopicToTopic(t, track, idx));
  const aiRemaining = [...newAiTopics, ...priorAiRemaining];
  const fallback = fallbackTrackTopics(track).slice(0, FALLBACK_POOL_CAP);
  return {
    track,
    topics: [...aiRemaining, ...fallback],
    aiRemaining,
  };
}

function buildFallbackPool(track: Track): CachedPool {
  return {
    track,
    topics: fallbackTrackTopics(track),
    aiRemaining: [],
  };
}

export async function ensureTopicPool(track: Track): Promise<CachedPool> {
  const existing = sessionCache.get(track);
  if (existing && existing.topics.length > 0) return existing;

  if (inflight) {
    const result = await inflight;
    if (result && result.track === track) return result;
  }

  inflight = (async () => {
    const priorRemaining = readPersistedAi(track).map((g, i) =>
      aiTopicToTopic(g, track, i)
    );

    try {
      const response = await requestTopicPool(track, POOL_TARGET);
      const pool = buildPoolFromAi(response.topics, track, priorRemaining);
      sessionCache.set(track, pool);
      persistCache(track, pool);
      return pool;
    } catch (err) {
      if (err instanceof AIUnavailableError) {
        const persistedPool: CachedPool = priorRemaining.length
          ? {
              track,
              topics: [...priorRemaining, ...fallbackTrackTopics(track)],
              aiRemaining: priorRemaining,
            }
          : buildFallbackPool(track);
        sessionCache.set(track, persistedPool);
        return persistedPool;
      }
      const fallback = buildFallbackPool(track);
      sessionCache.set(track, fallback);
      return fallback;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function invalidateTopicPool(track: Track) {
  sessionCache.delete(track);
  try {
    sessionStorage.removeItem(cacheKey(track));
  } catch {
    /* ignore */
  }
}


export function pickFromPool(
  pool: CachedPool,
  excludeId: string,
  recentIds: string[]
): Topic | null {
  const candidates = pool.topics.filter(
    (t) => t.id !== excludeId && !recentIds.includes(t.id)
  );
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  const notCurrent = pool.topics.filter((t) => t.id !== excludeId);
  if (notCurrent.length > 0) {
    return notCurrent[Math.floor(Math.random() * notCurrent.length)];
  }
  if (pool.topics.length > 0) {
    return pool.topics[Math.floor(Math.random() * pool.topics.length)];
  }
  return null;
}

/**
 * Convenience: same as before — used by track changes / fallback paths.
 */
export function pickLocalFallback(
  track: Track,
  excludeId?: string,
  recentIds: string[] = []
): Topic {
  return pickRandomTopic(track, { excludeId, recentIds });
}

export interface SpinState {
  spinning: boolean;
  displayTopic: Topic | null;
}

export function runSpinAnimation(args: {
  cycleTopics: Topic[];
  target: Topic;
  reducedMotion: boolean;
  durationMs?: number;
  onTick: (display: Topic, progress: number) => void;
  onDone: (final: Topic) => void;
}): { cancel: () => void } {
  const {
    cycleTopics,
    target,
    reducedMotion,
    onTick,
    onDone,
  } = args;
  const duration = args.durationMs ?? 1800;

  if (reducedMotion || cycleTopics.length === 0 || duration <= 0) {
    onTick(target, 1);
    onDone(target);
    return { cancel: () => undefined };
  }

  let raf = 0;
  let start = 0;
  let cancelled = false;
  const sequence: Topic[] = [];
  let lastIdx = -1;
  for (let i = 0; i < 28; i++) {
    if (cycleTopics.length === 0) break;
    let idx = Math.floor(Math.random() * cycleTopics.length);
    if (idx === lastIdx) idx = (idx + 1) % cycleTopics.length;
    sequence.push(cycleTopics[idx]);
    lastIdx = idx;
  }
  sequence.push(target);

  const tickCount = sequence.length;
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  const frame = (now: number) => {
    if (cancelled) return;
    if (!start) start = now;
    const elapsed = now - start;
    const linear = Math.min(1, elapsed / duration);
    const eased = easeOut(linear);

    const position = eased * (tickCount - 1);
    const index = Math.min(tickCount - 1, Math.round(position));
    const current = sequence[index];
    onTick(current, eased);

    if (linear < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      onTick(target, 1);
      onDone(target);
    }
  };

  raf = requestAnimationFrame(frame);

  return {
    cancel: () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    },
  };
}
