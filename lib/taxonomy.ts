export type TrackCategoryMap = {
    Frontend: readonly string[];
    Backend: readonly string[];
    'System Design': readonly string[];
    DevOps: readonly string[];
};

export const TRACK_CATEGORIES: TrackCategoryMap = {
    Frontend: [
        'Frameworks & Rendering',
        'JavaScript & TypeScript Internals',
        'Browser & DOM',
        'State & Data Flow',
        'CSS & Layout',
        'Performance & Core Web Vitals',
        'Testing & Tooling',
        'Accessibility & Internationalization',
        'Web Security (CORS, CSP, XSS)',
        'APIs & Networking (fetch, GraphQL, WebSockets)',
    ],
    Backend: [
        'APIs & Protocols (REST, GraphQL, gRPC)',
        'Databases & Storage (SQL, NoSQL)',
        'Data Modeling & Schema Design',
        'Concurrency & Performance',
        'Security & Authentication',
        'Caching & Invalidation',
        'Testing & Reliability',
        'Messaging & Async Processing',
        'Idempotency & Reliability Patterns',
        'Observability & Logging',
    ],
    'System Design': [
        'Scalability & Load Balancing',
        'Data Modeling & Storage',
        'Caching & Consistency',
        'Asynchronous Processing & Queues',
        'Reliability & Failure Handling',
        'API & Integration Design',
        'Distributed Transactions & Sagas',
        'Real-time Systems',
        'Capacity Planning & Cost',
        'Resilience & Chaos Engineering',
    ],
    DevOps: [
        'CI/CD & Pipelines',
        'Containers & Orchestration (Docker, Kubernetes)',
        'Cloud Infrastructure',
        'Observability & Monitoring',
        'Networking & Security',
        'Reliability & Incident Response',
        'Infrastructure as Code',
        'Secrets & Identity Management',
        'GitOps & Deployment Strategies',
        'Performance & Capacity Planning',
    ],
};

export const DEFAULT_TRACK = 'Frontend';

export const QUESTION_STYLES: readonly string[] = [
    'Explain / Conceptual',
    'Debugging',
    'Scenario-based',
    'Comparison / Tradeoff',
    'Implementation / Design',
    'Performance',
    'Architecture',
    'Practical Troubleshooting',
];

export type QuestionStyle = (typeof QUESTION_STYLES)[number];

export function isKnownTrack(track: string): track is keyof TrackCategoryMap {
    return Object.prototype.hasOwnProperty.call(TRACK_CATEGORIES, track);
}

export function categoriesForTrack(track: string): readonly string[] {
    return TRACK_CATEGORIES[(isKnownTrack(track) ? track : DEFAULT_TRACK) as keyof TrackCategoryMap];
}

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

export function isValidQuestionStyle(value: unknown): boolean {
    return typeof value === 'string' && QUESTION_STYLES.includes(value as QuestionStyle);
}

export function normalizeQuestionStyle(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    if (QUESTION_STYLES.includes(trimmed as QuestionStyle)) {
        return trimmed;
    }
    const lower = trimmed.toLowerCase();
    const match = QUESTION_STYLES.find((s) => s.toLowerCase() === lower);
    return match ?? null;
}
