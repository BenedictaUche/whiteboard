# Contributing to Whiteboard

Thanks for your interest in contributing to Whiteboard!

Whiteboard is an open-source developer interview practice tool. Contributions of all kinds are welcome, including code, bug reports, ideas, documentation, and improvements.

## Before You Start

If you want to work on a significant change, please open an issue first so we can discuss it before you start.

For small fixes, you can usually go ahead and open a pull request.

You can contribute by reporting bugs, suggesting improvements, fixing issues, improving existing features, adding new features, writing tests, or improving documentation.

## Local Development

### 1. Fork the repository

Create your own fork of the Whiteboard repository and clone it locally.

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:
```bash
cp .env.example .env.local
```
Add the required values to .env.local.

Never commit API keys or other secrets.

### 4. Start the development server
```bash
    npm run dev
```

Follow the project's README if the development setup changes.

### Making Changes

Create a branch for your work:
```bash
git checkout -b feature/your-change
```
Keep changes focused. Avoid unrelated refactoring or changes to existing behavior unless they are part of the issue you're working on.

Before opening a pull request, make sure:

- The project builds successfully
- TypeScript checks pass
- Your changes work locally
- You have not committed secrets
- Your code follows the existing project style

Run:

```bash
npm run lint
npm run typecheck
npm run build
Pull Requests
```

When opening a pull request:

- Clearly describe what you changed
- Explain why the change was needed
- Link the related issue if there is one
- Keep the pull request focused
- Include screenshots or recordings for UI changes when useful

All pull requests are reviewed before being merged.

Please be open to feedback and requested changes during the review process.

### Commit Messages

Write clear commit messages that describe the change.

Examples:

feat: add system design topics
fix: handle failed topic generation
docs: update contribution guide
Questions

If you're unsure about something, open an issue or start a discussion.

Thanks for helping make Whiteboard better!
