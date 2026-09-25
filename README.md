# Whiteboard

Whiteboard is a lightweight interview practice tool for software engineers. It helps developers improve their technical communication by researching engineering topics, presenting their explanations aloud, and receiving AI-powered feedback.

The goal is:

> Practice, Explain and Improve.

## Features

- Random technical interview topics
- Quick Pitch and Deep Research modes
- Built-in research and presentation timers
- Real-time speech transcription
- AI-powered feedback on your explanations
- Topics across multiple engineering disciplines

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- OpenRouter API
- Web Speech API

## Getting Started

Clone the repository:

```bash
git clone <repository-url>
```

Install dependencies:

```bash
npm install
```

Create your own `.env.local` (never commit it - see `.env.example` for the required variables):

```bash
cp .env.example .env.local
```

Then fill in your OpenRouter API key in `.env.local`:

```env
OPENROUTER_API_KEY=your_api_key
OPENROUTER_MODEL=
```

Start the development server:

```bash
npm run dev
```

The application will be available at:

```
http://localhost:3000
```

The local dev server serves the `/api/*` routes through the Vite config, so no extra process is needed. Alternatively, you can run the full Vercel environment locally:

```bash
npm run dev:vercel
```

## Environment Variables

`.env.example` documents all required variables. Copy it to `.env.local` and fill in your own values. Secrets must never be committed.

- **Server-side only** (used by the `/api/*` routes, never exposed to the browser, no `VITE_` prefix): `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`
- **Client-exposed** (embedded in the browser bundle, `VITE_` prefix): `VITE_POSTHOG_PROJECT_TOKEN`, `VITE_POSTHOG_HOST`

## Deployment (Vercel)

- **Preview deployments** are created automatically for pull requests and feature branches, so contributors can test changes before they reach production.
- **Production** is deployed from `main` and uses production environment variables.
- Environment variables are configured in the Vercel dashboard (names only — the same ones listed above). You do **not** need access to production secrets to contribute; local development works entirely with your own `.env.local`.

## How It Works

1. Select a learning track.
2. Choose either **Quick Pitch** or **Deep Research**.
3. Receive a randomly generated interview topic.
4. Research the topic (Deep Research mode only).
5. Explain the concept aloud.
6. Review your transcript.
7. Receive AI-powered feedback.

## Project Status

Whiteboard is currently under active development.

Upcoming improvements include:

- More interview topics
- Better speech recognition
- Improved AI feedback
- Additional engineering tracks
- Enhanced interview simulations

## License

MIT
