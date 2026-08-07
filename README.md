# Whiteboard

Whiteboard is a lightweight interview practice tool for software engineers. It helps developers improve their technical communication by researching engineering topics, presenting their explanations aloud, and receiving AI-powered feedback.

The goal is simple:

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

Create a `.env` file and add your OpenRouter API key:

```env
OPENROUTER_API_KEY=your_api_key
OPENROUTER_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
```

Start the development server:

```bash
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

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
