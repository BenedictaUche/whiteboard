import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateFeedback, AIUnavailableError } from '../lib/ai';

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

    const feedback = await generateFeedback({
      topicTitle,
      topicHint: typeof topic === 'object' ? topic?.hint : undefined,
      track: track || 'Software Engineering',
      mode: mode || 'Deep Research',
      transcript,
      notes: notes || '',
    });

    return res.status(200).json(feedback);
  } catch (err: unknown) {
    console.error('Error generating feedback:', err);
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
