import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateFeedback, AIUnavailableError } from '../lib/ai.js';
export const config = {
    maxDuration: 60,
};
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { topic, track, mode, transcript, notes } = req.body ?? {};
        const topicTitle = typeof topic === 'string' ? topic : topic?.title;
        if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
            return res.status(400).json({ error: 'Transcript is required for feedback.' });
        }
        if (!topicTitle) {
            return res.status(400).json({ error: 'Topic is required for feedback.' });
        }
        const rawConcepts = typeof topic === 'object' && topic ? topic : {};
        const expectedConcepts = Array.isArray(rawConcepts.expectedConcepts)
            ? (rawConcepts.expectedConcepts.filter((c: unknown) => typeof c === 'string') as string[])
            : Array.isArray(rawConcepts.keyPoints)
                ? (rawConcepts.keyPoints.filter((c: unknown) => typeof c === 'string') as string[])
                : undefined;
        const feedback = await generateFeedback({
            topicTitle,
            difficulty: typeof rawConcepts.diff === 'string' ? rawConcepts.diff : undefined,
            track: track || 'Software Engineering',
            mode: mode || 'Deep Research',
            expectedConcepts,
            transcript,
            notes: notes || '',
        });
        return res.status(200).json(feedback);
    }
    catch (err: unknown) {
        console.error('Error generating feedback:', err);
        if (err instanceof AIUnavailableError) {
            const status = typeof err.status === 'number' ? err.status : 503;
            return res.status(status).json({ error: err.message });
        }
        const message = err instanceof Error ? err.message : 'AI feedback is currently unavailable.';
        return res.status(500).json({ error: message });
    }
}
