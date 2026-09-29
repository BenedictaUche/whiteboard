export type TrackCategoryMap = {
    Frontend: readonly string[];
    Backend: readonly string[];
    'System Design': readonly string[];
    DevOps: readonly string[];
};

export const TRACK_CATEGORIES: TrackCategoryMap = {
    Frontend: [
        'Frameworks & Rendering',
        'JavaScript & TypeScript',
        'Performance',
        'State & Data Flow',
        'CSS & Layout',
        'Testing & Tooling',
    ],
    Backend: [
        'APIs & Protocols',
        'Databases & Storage',
        'Concurrency & Performance',
        'Security',
        'Caching',
        'Testing & Reliability',
    ],
    'System Design': [
        'Scalability & Load',
        'Data Modeling & Storage',
        'Caching & Consistency',
        'Asynchronous Processing',
        'Reliability & Failures',
        'API & Integration Design',
    ],
    DevOps: [
        'CI/CD & Pipelines',
        'Containers & Orchestration',
        'Cloud Infrastructure',
        'Observability',
        'Networking & Security',
        'Reliability & Incident Response',
    ],
};

export const DEFAULT_TRACK = 'Frontend';

export function isKnownTrack(track: string): track is keyof TrackCategoryMap {
    return Object.prototype.hasOwnProperty.call(TRACK_CATEGORIES, track);
}

/** Known categories for a track; unknown tracks get the Frontend vocabulary. */
export function categoriesForTrack(track: string): readonly string[] {
    return TRACK_CATEGORIES[(isKnownTrack(track) ? track : DEFAULT_TRACK) as keyof TrackCategoryMap];
}

/** True when `category` is one of the allowed categories for the track. */
export function isValidCategory(track: string, category: unknown): boolean {
    return (
        typeof category === 'string' &&
        categoriesForTrack(track).includes(category)
    );
}

export function normalizeCategory(track: string, value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const allowed = categoriesForTrack(track);
    const trimmed = value.trim();
    if (allowed.includes(trimmed)) {
        return trimmed;
    }
    const lower = trimmed.toLowerCase();
    const match = allowed.find((c) => c.toLowerCase() === lower);
    return match ?? null;
}
