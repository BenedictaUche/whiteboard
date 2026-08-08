import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isOpenRouterConfigured } from '../src/lib/api.js';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    aiConfigured: isOpenRouterConfigured(),
    model: process.env.OPENROUTER_MODEL || 'mistralai/voxtral-small-24b-2507',
  });
}
