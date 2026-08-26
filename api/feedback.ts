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

    // Evaluation context: expectedConcepts from AI-generated topics; static
    // topics fall back to their keyPoints. Never required — the prompt tells
    // the model to infer strong-answer concepts when none are provided.
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
