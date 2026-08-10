import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage & { body?: any }, res: ServerResponse & { status?: any; json?: any }, next) => {
        const url = req.url ? new URL(req.url, `http://${req.headers.host || 'localhost'}`) : null;
        if (!url || !url.pathname.startsWith('/api/')) {
          return next();
        }

        const routeMap: Record<string, string> = {
          '/api/health': '/api/health.ts',
          '/api/custom-topic': '/api/custom-topic.ts',
          '/api/feedback': '/api/feedback.ts',
          '/api/topics': '/api/topics.ts',
        };

        const targetFile = routeMap[url.pathname];

        res.status = function (code: number) {
          res.statusCode = code;
          return res;
        };

        res.json = function (data: any) {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify(data));
          return res;
        };

        if (!targetFile) {
          return res.status(404).json({ error: 'API route not found' });
        }

        try {
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            if (req.body === undefined) {
              const buffers: Buffer[] = [];
              for await (const chunk of req) {
                buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
              }
              const rawBody = Buffer.concat(buffers).toString('utf-8');
              if (rawBody.trim()) {
                try {
                  req.body = JSON.parse(rawBody);
                } catch {
                  req.body = {};
                }
              } else {
                req.body = {};
              }
            }
          }

          const module = await server.ssrLoadModule(targetFile);
          const handler = module.default;

          if (typeof handler === 'function') {
            await handler(req, res);
          } else {
            res.status(500).json({ error: 'Handler function not exported' });
          }
        } catch (err: any) {
          console.error(`Error executing ${url.pathname}:`, err);
          res.status(500).json({ error: err?.message || 'Internal server error' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), tailwindcss(), localApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
