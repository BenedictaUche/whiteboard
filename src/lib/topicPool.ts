import type { Topic, Track, DrillRecord } from '../types';
import { getTopicsForTrack, pickRandomTopic } from '../data/questions';
import { requestTopicPool, type GeneratedTopic, AIUnavailableError } from './api';
import { trackEvent } from './analytics';

const EXCLUDE_HISTORY_LIMIT = 15;
const EXCLUDE_POOL_LIMIT = 15;
const EXCLUDE_TOTAL_LIMIT = 25;

function titleKey(title: string): string {
    return title.trim().toLowerCase();
}

const SEEN_TITLES_LIMIT = 30;
function seenTitlesKey(track: Track): string {
    return `Whiteboard_seen_${track}`;
}
function loadSeenTitles(track: Track): string[] {
    try {
        const raw = safeStorageGet(seenTitlesKey(track));
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((t): t is string => typeof t === 'string' && t.length > 0);
    }
    catch {
        return [];
    }
}
function saveSeenTitles(track: Track, titles: string[]): void {
    // insertion order = oldest first
    safeStorageSet(seenTitlesKey(track), JSON.stringify(titles.slice(-SEEN_TITLES_LIMIT)));
}

export function recordConsumedTitles(track: Track, currentBank: Topic[]): void {
    const pool = getCachedPool(track);
    const remainingTitles = new Set((pool?.aiRemaining ?? []).map((t) => titleKey(t.title)));
    const seen = loadSeenTitles(track);
    const seenKeys = new Set(seen.map(titleKey));
    for (const t of currentBank) {
        if (!t.id.startsWith('ai-') && !t.id.startsWith('custom-'))
            continue;
        const key = titleKey(t.title);
        if (!key || remainingTitles.has(key) || seenKeys.has(key))
            continue;
        seenKeys.add(key);
        seen.push(t.title.trim());
    }
    saveSeenTitles(track, seen);
}

export function buildExclusions(track: Track, history: DrillRecord[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    const push = (raw: string | undefined) => {
        if (!raw)
            return;
        const key = titleKey(raw);
        if (!key || seen.has(key))
            return;
        seen.add(key);
        out.push(raw.trim());
    };
    // unused pool titles first - most important to not regenerate,
    // then recent practiced history for this track - most recent first.
    const pool = getCachedPool(track);
    if (pool) {
        for (const t of pool.aiRemaining) {
            push(t.title);
            if (out.length >= EXCLUDE_POOL_LIMIT)
                break;
        }
    }
    for (const record of history) {
        if (record.track !== track)
            continue;
        push(record.topic?.title);
        if (out.length >= EXCLUDE_POOL_LIMIT + EXCLUDE_HISTORY_LIMIT)
            break;
    }

    for (const t of loadSeenTitles(track)) {
        if (out.length >= EXCLUDE_TOTAL_LIMIT)
            break;
        push(t);
    }
    return out.slice(0, EXCLUDE_TOTAL_LIMIT);
}
export interface CachedPool {
    topics: Topic[];
    aiRemaining: Topic[];
    track: Track;
}
const POOL_TARGET = 10;
const FALLBACK_POOL_CAP = 30;
const sessionCache = new Map<Track, CachedPool>();
const inflightByTrack = new Map<Track, Promise<CachedPool>>();
const refillsInFlight = new Map<Track, Promise<Topic[]>>();
function safeStorageGet(key: string): string | null {
    try {
        return sessionStorage.getItem(key);
    }
    catch {
        return null;
    }
}
function safeStorageSet(key: string, value: string): void {
    try {
        sessionStorage.setItem(key, value);
    }
    catch {
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
        topicCategory: t.category,
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
        topicCategory: t.topicCategory,
        expectedConcepts: t.expectedConcepts,
    }));
    safeStorageSet(cacheKey(track), JSON.stringify({ topics: slim }));
}
function readPersistedAi(track: Track): GeneratedTopic[] {
    const raw = safeStorageGet(cacheKey(track));
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed?.topics))
            return [];
        return parsed.topics.map((t: Record<string, unknown>) => ({
            title: typeof t.title === 'string' ? t.title : '',
            difficulty: t.diff as GeneratedTopic['difficulty'],
            category: typeof t.topicCategory === 'string' ? t.topicCategory : undefined,
            expectedConcepts: Array.isArray(t.expectedConcepts)
                ? (t.expectedConcepts.filter((c: unknown) => typeof c === 'string') as string[])
                : undefined,
        })).filter((t: GeneratedTopic) => Boolean(t.title) && Boolean(t.difficulty));
    }
    catch {
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
export async function ensureTopicPool(track: Track, options: {
    history?: DrillRecord[];
} = {}): Promise<CachedPool> {
    const existing = sessionCache.get(track);
    if (existing && existing.topics.length > 0)
        return existing;
    const alreadyInflight = inflightByTrack.get(track);
    if (alreadyInflight)
        return alreadyInflight;
    const generation = (async (): Promise<CachedPool> => {
        const priorRemaining = readPersistedAi(track).map((g, i) => aiTopicToTopic(g, track, i));
        trackEvent('topic_generation_started', { track });
        try {
            // generator should avoid what the user has already practiced
            // and what is still sitting unused in their pool.
            const excludeTitles = buildExclusions(track, options.history ?? []);
            const response = await requestTopicPool(track, POOL_TARGET, excludeTitles);
            const pool = buildPoolFromAi(response.topics, track, priorRemaining);
            sessionCache.set(track, pool);
            persistCache(track, pool);
            trackEvent('topic_generation_completed', { track });
            return pool;
        }
        catch (err) {
            trackEvent('topic_generation_failed', { track });
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
        }
    })();
    inflightByTrack.set(track, generation);
    void generation
        .catch(() => undefined)
        .finally(() => {
        if (inflightByTrack.get(track) === generation)
            inflightByTrack.delete(track);
    });
    return generation;
}
export function invalidateTopicPool(track: Track) {
    sessionCache.delete(track);
    try {
        sessionStorage.removeItem(cacheKey(track));
    }
    catch {
    }
}
export function getCachedPool(track: Track): CachedPool | null {
    return sessionCache.get(track) ?? null;
}
export function consumePooledTopic(track: Track, topicId: string) {
    const pool = getCachedPool(track);
    if (!pool)
        return;
    const before = pool.aiRemaining.length;
    pool.aiRemaining = pool.aiRemaining.filter((t) => t.id !== topicId);
    if (pool.aiRemaining.length !== before) {
        persistCache(track, pool);
    }
}
const REFILL_THRESHOLD = 3;
export function poolNeedsRefill(track: Track): boolean {
    const pool = getCachedPool(track);
    if (!pool)
        return true;
    return pool.aiRemaining.length < REFILL_THRESHOLD;
}
export async function refillPool(track: Track, currentBank: Topic[], options: {
    history?: DrillRecord[];
} = {}): Promise<Topic[]> {
    const alreadyRefilling = refillsInFlight.get(track);
    if (alreadyRefilling)
        return alreadyRefilling;
    const task = (async (): Promise<Topic[]> => {
        try {
            const pending = inflightByTrack.get(track);
            if (pending)
                await pending.catch(() => undefined);
            invalidateTopicPool(track);
            const pool = await ensureTopicPool(track, { history: options.history });
            if (pool.topics.length === 0)
                return currentBank;
            const existingIds = new Set(currentBank.map((t) => t.id));
            const existingTitles = new Set(currentBank.map((t) => t.title.toLowerCase()));
            // a topic already consumed in this browser can never
            // re-enter the bank, even if the model ignored the exclusions.
            const seenTitles = new Set(loadSeenTitles(track).map(titleKey));
            const merged = [...currentBank];
            for (const t of pool.topics) {
                if (existingIds.has(t.id) || existingTitles.has(t.title.toLowerCase()))
                    continue;
                if (seenTitles.has(titleKey(t.title)))
                    continue;
                merged.push(t);
            }
            return merged;
        }
        catch {
            return currentBank;
        }
    })();
    refillsInFlight.set(track, task);
    void task
        .catch(() => currentBank)
        .finally(() => {
        if (refillsInFlight.get(track) === task)
            refillsInFlight.delete(track);
    });
    return task;
}
export function pickFromPool(pool: CachedPool, excludeId: string, recentIds: string[]): Topic | null {
    const candidates = pool.topics.filter((t) => t.id !== excludeId && !recentIds.includes(t.id));
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
export function pickLocalFallback(track: Track, excludeId?: string, recentIds: string[] = []): Topic {
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
}): {
    cancel: () => void;
} {
    const { cycleTopics, target, reducedMotion, onTick, onDone, } = args;
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
        if (cycleTopics.length === 0)
            break;
        let idx = Math.floor(Math.random() * cycleTopics.length);
        if (idx === lastIdx)
            idx = (idx + 1) % cycleTopics.length;
        sequence.push(cycleTopics[idx]);
        lastIdx = idx;
    }
    sequence.push(target);
    const tickCount = sequence.length;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const frame = (now: number) => {
        if (cancelled)
            return;
        if (!start)
            start = now;
        const elapsed = now - start;
        const linear = Math.min(1, elapsed / duration);
        const eased = easeOut(linear);
        const position = eased * (tickCount - 1);
        const index = Math.min(tickCount - 1, Math.round(position));
        const current = sequence[index];
        onTick(current, eased);
        if (linear < 1) {
            raf = requestAnimationFrame(frame);
        }
        else {
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
