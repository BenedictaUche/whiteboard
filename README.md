# Whiteboard

Whiteboard is a lightweight interview practice tool for software engineers.

It helps developers improve their technical communication by researching engineering topics, presenting their explanations aloud, and receiving AI-powered feedback.

**Practice. Explain. Improve.**

[Live Demo](https://whiteboard-drill.site) · [Contributing](CONTRIBUTING.md)

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

### Prerequisites

- Node.js
- An OpenRouter API key

### Installation

Clone the repository:

```bash
git clone https://github.com/BenedictaUche/whiteboard.git
cd whiteboard
```

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Then add your OpenRouter credentials to `.env.local`:

```
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

The local development server serves the `/api/*` routes through the Vite configuration, so no additional process is required. Alternatively, you can run the full Vercel environment locally:

```bash
npm run dev:vercel
```

## Environment Variables

`.env.example` documents all required variables. Copy it to `.env.local` and fill in your own values.

### Server-side only

Used by the `/api/*` routes and never exposed to the browser:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

### Client-exposed

These are embedded in the browser bundle:

- `VITE_POSTHOG_PROJECT_TOKEN`
- `VITE_POSTHOG_HOST`

Never commit `.env.local` or any file containing secrets.

## How It Works

1. Select a learning track.
2. Choose either Quick Pitch or Deep Research.
3. Receive a randomly generated interview topic.
4. Research the topic in Deep Research mode.
5. Explain the concept aloud.
6. Review your transcript.
7. Receive AI-powered feedback.

## Deployment

Whiteboard is deployed on Vercel.

- Preview deployments are created automatically for pull requests and feature branches.
- Production is deployed from `main`.
- Environment variables are configured in the Vercel dashboard.
- Contributors do not need access to production secrets. Local development works with their own `.env.local`.

## Contributing

Whiteboard is open source and contributions are welcome.

If you'd like to contribute, check out [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

Have an idea for the project or something you'd like to work on? Feel free to open an issue or reach out.

## Project Status

Whiteboard is actively being developed.

Some areas we're working on include:

- More interview topics
- Better speech recognition
- Improved AI feedback
- Additional engineering tracks
- Enhanced interview simulations

## License

MIT
