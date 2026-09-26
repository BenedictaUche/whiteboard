import { FEEDBACK_SYSTEM_PROMPT, FEEDBACK_JSON_SCHEMA_DESCRIPTION, buildFeedbackUserPrompt, CUSTOM_TOPIC_SYSTEM_PROMPT, buildCustomTopicUserPrompt, TOPIC_POOL_SYSTEM_PROMPT, buildTopicPoolUserPrompt, } from './prompts.js';
export class AIUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIUnavailableError';
    }
}
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'mistralai/voxtral-small-24b-2507';
async function callOpenRouterJson(systemPrompt: string, userPrompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new AIUnavailableError('OpenRouter is not configured.');
    }
    const makeBody = (useJsonMode: boolean) => JSON.stringify({
        model: MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        ...(useJsonMode ? { response_format: { type: 'json_object' } } : {}),
    });
    let response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: makeBody(true),
    });
    if (!response.ok && response.status === 400) {
        response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: makeBody(false),
        });
    }
    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new AIUnavailableError(`OpenRouter request failed (${response.status}): ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new AIUnavailableError('OpenRouter returned an empty response.');
    }
    return content;
}
function parseJson<T>(raw: string): T {
    const trimmed = raw.trim();
    const candidates: string[] = [trimmed];
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced && fenced[1])
        candidates.push(fenced[1].trim());
    const firstBrace = trimmed.indexOf('{');
    const firstBracket = trimmed.indexOf('[');
    const lastBrace = trimmed.lastIndexOf('}');
    const lastBracket = trimmed.lastIndexOf(']');
    const startCandidates = [firstBrace, firstBracket].filter((i) => i >= 0);
    if (startCandidates.length > 0) {
        const start = Math.min(...startCandidates);
        const endCandidates = [lastBrace, lastBracket].filter((i) => i >= 0);
        if (endCandidates.length > 0) {
            const end = Math.max(...endCandidates);
            if (end > start)
                candidates.push(trimmed.slice(start, end + 1));
        }
    }
    for (const cand of candidates) {
        try {
            return JSON.parse(cand) as T;
        }
        catch {
        }
    }
    const repaired = repairJsonish(trimmed);
    if (repaired) {
        try {
            return JSON.parse(repaired) as T;
        }
        catch {
        }
    }
    throw new AIUnavailableError('Model returned invalid JSON.');
}
function repairJsonish(input: string): string | null {
    const s = input;
    if (!/[{\[]/.test(s))
        return null;
    let out = '';
    let inDouble = false;
    let inSingle = false;
    let escape = false;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (escape) {
            out += c;
            escape = false;
            continue;
        }
        if (c === '\\') {
            out += c;
            escape = true;
            continue;
        }
        if (c === '"' && !inSingle) {
            inDouble = !inDouble;
            out += c;
            continue;
        }
        if (c === "'" && !inDouble) {
            inSingle = !inSingle;
            out += '"';
            continue;
        }
        out += c;
    }
    out = out.replace(/,(\s*[}\]])/g, '$1');
    return out;
}
export async function generateCustomTopic(input: {
    track: string;
    difficulty: string;
}) {
    const raw = await callOpenRouterJson(CUSTOM_TOPIC_SYSTEM_PROMPT, buildCustomTopicUserPrompt(input));
    return normalizeGeneratedTopic(parseJson<unknown>(raw));
}
export interface GeneratedTopic {
    title: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Hard';
    expectedConcepts?: string[];
}
interface GeneratedSingleTopic extends GeneratedTopic {
    researchTime?: number;
    presentationTime?: number;
}
export interface TopicPool {
    topics: GeneratedTopic[];
}
const DIFFICULTIES: GeneratedTopic['difficulty'][] = ['Beginner', 'Intermediate', 'Hard'];
function normalizeDifficulty(value: unknown): GeneratedTopic['difficulty'] {
    if (typeof value === 'string') {
        const v = value.trim();
        if (DIFFICULTIES.includes(v as GeneratedTopic['difficulty'])) {
            return v as GeneratedTopic['difficulty'];
        }
        const lower = v.toLowerCase();
        if (lower.startsWith('begin'))
            return 'Beginner';
        if (lower.startsWith('hard') || lower.startsWith('adv'))
            return 'Hard';
        if (lower.startsWith('inter') || lower.startsWith('med'))
            return 'Intermediate';
    }
    return 'Intermediate';
}
function normalizeTitle(value: unknown): string | null {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim().replace(/\s+/g, ' ');
    if (!trimmed)
        return null;
    return trimmed.length > 240 ? `${trimmed.slice(0, 237)}…` : trimmed;
}
function normalizeExpectedConcepts(value: unknown): string[] | undefined {
    if (!Array.isArray(value))
        return undefined;
    const out: string[] = [];
    for (const item of value) {
        if (typeof item !== 'string')
            continue;
        const trimmed = item.trim().replace(/\s+/g, ' ').slice(0, 160);
        if (trimmed && !out.some((c) => c.toLowerCase() === trimmed.toLowerCase()))
            out.push(trimmed);
        if (out.length >= 10)
            break;
    }
    return out.length > 0 ? out : undefined;
}
function normalizeMinutes(value: unknown): number | undefined {
    const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
    if (!Number.isFinite(n))
        return undefined;
    return Math.max(1, Math.min(60, Math.round(n)));
}
function normalizeGeneratedTopic(raw: unknown): GeneratedSingleTopic {
    const title = normalizeTitle(raw && typeof raw === 'object' ? (raw as GeneratedSingleTopic).title : undefined);
    if (!title) {
        throw new AIUnavailableError('Model returned an unusable topic.');
    }
    const src = (raw ?? {}) as Record<string, unknown>;
    return {
        title,
        difficulty: normalizeDifficulty(src.difficulty ?? src.diff),
        expectedConcepts: normalizeExpectedConcepts(src.expectedConcepts),
        researchTime: normalizeMinutes(src.researchTime),
        presentationTime: normalizeMinutes(src.presentationTime),
    };
}
function normalizeTopicPool(raw: unknown): TopicPool {
    const topicsRaw = raw && typeof raw === 'object' && Array.isArray((raw as TopicPool).topics)
        ? (raw as TopicPool).topics
        : [];
    const seen = new Set<string>();
    const out: GeneratedTopic[] = [];
    for (const t of topicsRaw) {
        if (!t || typeof t !== 'object')
            continue;
        const title = normalizeTitle((t as GeneratedTopic).title);
        if (!title)
            continue;
        const key = title.toLowerCase();
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push({
            title,
            difficulty: normalizeDifficulty((t as GeneratedTopic).difficulty),
            expectedConcepts: normalizeExpectedConcepts((t as GeneratedTopic).expectedConcepts),
        });
        if (out.length >= 16)
            break;
    }
    return { topics: out };
}
export async function generateTopicPool(input: {
    track: string;
    count: number;
}): Promise<TopicPool> {
    const raw = await callOpenRouterJson(TOPIC_POOL_SYSTEM_PROMPT, buildTopicPoolUserPrompt(input));
    return normalizeTopicPool(parseJson<unknown>(raw));
}
const IMPORTANCES = ['low', 'medium', 'high'] as const;
function clampScore(value: unknown, max: number): number | null {
    const n = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
    if (!Number.isFinite(n))
        return null;
    return Math.max(0, Math.min(max, Math.round(n * 10) / 10));
}
function asTrimmedString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}
function normalizeStrengths(value: unknown): {
    point: string;
    evidence?: string;
}[] {
    if (!Array.isArray(value))
        return [];
    const out: {
        point: string;
        evidence?: string;
    }[] = [];
    for (const item of value.slice(0, 8)) {
        if (typeof item === 'string') {
            const point = item.trim();
            if (point)
                out.push({ point });
            continue;
        }
        if (item && typeof item === 'object') {
            const point = asTrimmedString((item as Record<string, unknown>).point);
            if (!point)
                continue;
            const evidence = asTrimmedString((item as Record<string, unknown>).evidence);
            out.push(evidence ? { point, evidence } : { point });
        }
    }
    return out;
}
function normalizeMissingConcepts(value: unknown): {
    concept: string;
    importance: (typeof IMPORTANCES)[number];
    explanation: string;
}[] {
    if (!Array.isArray(value))
        return [];
    const out: {
        concept: string;
        importance: (typeof IMPORTANCES)[number];
        explanation: string;
    }[] = [];
    for (const item of value.slice(0, 10)) {
        if (typeof item === 'string') {
            const concept = item.trim();
            if (concept)
                out.push({ concept, importance: 'medium', explanation: '' });
            continue;
        }
        if (item && typeof item === 'object') {
            const src = item as Record<string, unknown>;
            const concept = asTrimmedString(src.concept);
            if (!concept)
                continue;
            const rawImportance = asTrimmedString(src.importance).toLowerCase();
            const importance = (IMPORTANCES as readonly string[]).includes(rawImportance)
                ? (rawImportance as (typeof IMPORTANCES)[number])
                : 'medium';
            out.push({ concept, importance, explanation: asTrimmedString(src.explanation) });
        }
    }
    return out;
}
function normalizeCorrections(value: unknown): {
    misconception: string;
    correction: string;
}[] {
    if (!Array.isArray(value))
        return [];
    const out: {
        misconception: string;
        correction: string;
    }[] = [];
    for (const item of value.slice(0, 8)) {
        if (!item || typeof item !== 'object')
            continue;
        const src = item as Record<string, unknown>;
        const misconception = asTrimmedString(src.misconception);
        const correction = asTrimmedString(src.correction);
        if (misconception && correction)
            out.push({ misconception, correction });
    }
    return out;
}
export interface NormalizedFeedback {
    overallScore: number;
    scores: {
        technicalAccuracy: number;
        conceptCoverage: number;
        communication: number;
        structure: number;
        depth: number;
    };
    summary: string;
    strengths: {
        point: string;
        evidence?: string;
    }[];
    missingConcepts: {
        concept: string;
        importance: 'low' | 'medium' | 'high';
        explanation: string;
    }[];
    corrections: {
        misconception: string;
        correction: string;
    }[];
    interviewerFollowUp: {
        question: string;
        reason: string;
    };
    nextPractice: {
        instruction: string;
    };
}
export function normalizeFeedback(raw: unknown): NormalizedFeedback {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new AIUnavailableError('Model returned an unexpected feedback format.');
    }
    const src = raw as Record<string, unknown>;
    const scoresSrc = src.scores && typeof src.scores === 'object'
        ? (src.scores as Record<string, unknown>)
        : src;
    const fallbackDimension = clampScore(scoresSrc.technicalAccuracy, 10) ?? 5;
    const dimensionKeys = [
        'technicalAccuracy',
        'conceptCoverage',
        'communication',
        'structure',
        'depth',
    ] as const;
    const scores = {
        technicalAccuracy: clampScore(scoresSrc.technicalAccuracy, 10) ?? fallbackDimension,
        conceptCoverage: clampScore(scoresSrc.conceptCoverage, 10) ?? fallbackDimension,
        communication: clampScore(scoresSrc.communication, 10) ?? fallbackDimension,
        structure: clampScore(scoresSrc.structure, 10) ?? fallbackDimension,
        depth: clampScore(scoresSrc.depth, 10) ?? fallbackDimension,
    } satisfies NormalizedFeedback['scores'];
    let overallScore = clampScore(src.overallScore, 100);
    if (overallScore === null) {
        const avg = dimensionKeys.reduce((sum, key) => sum + scores[key], 0) / dimensionKeys.length;
        overallScore = Math.round(avg * 10);
    }
    const followUpSrc = src.interviewerFollowUp && typeof src.interviewerFollowUp === 'object'
        ? (src.interviewerFollowUp as Record<string, unknown>)
        : {};
    const nextPracticeSrc = src.nextPractice && typeof src.nextPractice === 'object'
        ? (src.nextPractice as Record<string, unknown>)
        : {};
    return {
        overallScore,
        scores,
        summary: asTrimmedString(src.summary),
        strengths: normalizeStrengths(src.strengths),
        missingConcepts: normalizeMissingConcepts(src.missingConcepts),
        corrections: normalizeCorrections(src.corrections),
        interviewerFollowUp: {
            question: asTrimmedString(followUpSrc.question),
            reason: asTrimmedString(followUpSrc.reason),
        },
        nextPractice: {
            instruction: asTrimmedString(nextPracticeSrc.instruction),
        },
    };
}
export async function generateFeedback(input: {
    topicTitle: string;
    difficulty?: string;
    track: string;
    mode: string;
    expectedConcepts?: string[];
    transcript: string;
    notes?: string;
}): Promise<NormalizedFeedback> {
    const raw = await callOpenRouterJson(`${FEEDBACK_SYSTEM_PROMPT}\n\n${FEEDBACK_JSON_SCHEMA_DESCRIPTION}`, buildFeedbackUserPrompt(input));
    return normalizeFeedback(parseJson<unknown>(raw));
}
