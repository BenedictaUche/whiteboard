import type { VercelRequest, VercelResponse } from '@vercel/node';

// Server-only check: OPENROUTER_API_KEY must never be referenced from client-side code.
function isOpenRouterConfigured(): boolean {
    return Boolean(process.env.OPENROUTER_API_KEY);
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        status: 'ok',
        aiConfigured: isOpenRouterConfigured(),
        model: process.env.OPENROUTER_MODEL || 'mistralai/voxtral-small-24b-2507',
    });
}
