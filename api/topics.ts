import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateTopicPool, AIUnavailableError } from '../lib/ai.js';
export const config = {
    maxDuration: 60,
};
const MIN_POOL_SIZE = 8;
const MAX_POOL_SIZE = 16;
const MAX_EXCLUDE_TITLES = 30;
const MAX_EXCLUDE_TITLE_LENGTH = 240;

/* keeps plain strings only, trims, caps length and count. Never trust the client payload verbatim. */
function sanitizeExcludeTitles(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }
    const out: string[] = [];
    for (const item of value) {
        if (typeof item !== 'string') {
            continue;
        }
        const trimmed = item.trim().slice(0, MAX_EXCLUDE_TITLE_LENGTH);
        if (!trimmed) {
            continue;
        }
        if (!out.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
            out.push(trimmed);
        }
        if (out.length >= MAX_EXCLUDE_TITLES) {
            break;
        }
    }
    return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { track, count, excludeTitles } = req.body ?? {};
        if (!track || typeof track !== 'string') {
            return res.status(400).json({ error: 'Track is required.' });
        }
        let requested = typeof count === 'number' && Number.isFinite(count) ? Math.floor(count) : 12;
        requested = Math.max(MIN_POOL_SIZE, Math.min(MAX_POOL_SIZE, requested));
        const pool = await generateTopicPool({
            track,
            count: requested,
            excludeTitles: sanitizeExcludeTitles(excludeTitles),
        });
        if (!pool.topics || pool.topics.length === 0) {
            return res.status(502).json({ error: 'AI returned no topics.' });
        }
        return res.status(200).json(pool);
    }
    catch (err: unknown) {
        console.error('Error generating topic pool:', err);
        const message = err instanceof AIUnavailableError
            ? err.message
            : err instanceof Error
                ? err.message
                : 'AI topic generation is currently unavailable.';
        const status = err instanceof AIUnavailableError ? 503 : 500;
        return res.status(status).json({ error: message });
    }
}
