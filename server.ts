import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  generateFeedback,
  generateCustomTopic,
  isOpenRouterConfigured,
  AIUnavailableError,
} from './src/lib/ai';

// Prefer local override files (same convention as Vite)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      aiConfigured: isOpenRouterConfigured(),
      model: process.env.OPENROUTER_MODEL || 'mistralai/voxtral-small-24b-2507',
    });
  });

  app.post('/api/feedback', async (req, res) => {
    try {
      const { topic, track, mode, transcript, notes } = req.body ?? {};
      const topicTitle =
        typeof topic === 'string' ? topic : topic?.title;

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

      res.json(feedback);
    } catch (err: unknown) {
      console.error('Error generating feedback:', err);
      const message =
        err instanceof AIUnavailableError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'AI feedback is currently unavailable.';
      const status = err instanceof AIUnavailableError ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/custom-topic', async (req, res) => {
    try {
      const { track, difficulty } = req.body ?? {};
      const topic = await generateCustomTopic({
        track: track || 'Frontend',
        difficulty: difficulty || 'Intermediate',
      });
      res.json(topic);
    } catch (err: unknown) {
      console.error('Error generating custom topic:', err);
      const message =
        err instanceof AIUnavailableError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'AI feedback is currently unavailable.';
      const status = err instanceof AIUnavailableError ? 503 : 500;
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Whiteboard server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
