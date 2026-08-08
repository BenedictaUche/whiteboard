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
  } catch (err: unknown) {
    console.error('Error generating custom topic:', err);
    const message =
      err instanceof AIUnavailableError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'AI feedback is currently unavailable.';
    const status = err instanceof AIUnavailableError ? 503 : 500;
    return res.status(status).json({ error: message });
  }
}
