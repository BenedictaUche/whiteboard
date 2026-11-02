import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateCustomTopic, AIUnavailableError } from '../lib/ai.js';
export const config = {
    maxDuration: 60,
};
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { track, difficulty } = req.body ?? {};
        const topic = await generateCustomTopic({
            track: track || 'Frontend',
            difficulty: difficulty || 'Intermediate',
        });
        return res.status(200).json(topic);
    }
    catch (err: unknown) {
        console.error('Error generating custom topic:', err);
        if (err instanceof AIUnavailableError) {
            const status = typeof err.status === 'number' ? err.status : 503;
            return res.status(status).json({ error: err.message });
        }
        const message = err instanceof Error ? err.message : 'AI topic generation is currently unavailable.';
        return res.status(500).json({ error: message });
    }
}
