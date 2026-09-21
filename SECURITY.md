# Security Policy

## Reporting a Security Issue

If you discover a security vulnerability in Whiteboard, please do not open a public GitHub issue.

Instead, report it privately to the [project maintainer](mailto:benedictaonyebuchi.uche@gmail.com).

Please include:

- A description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any relevant screenshots, logs, or proof of concept

We will review the report and respond as soon as possible.

## API Keys and Secrets

Never commit secrets to the repository.

This includes:

- API keys
- Access tokens
- Passwords
- Private credentials
- Production environment variables

Use local environment files for development.

For example:

```text
.env.local
```
The repository contains .env.example files with the required variable names but without secret values.

## OpenRouter API Key

Whiteboard uses the OpenRouter API for AI-powered features. The OpenRouter API key must remain server-side and must never be exposed in client-side code.

If you believe an API key has been exposed:

- Revoke or rotate the key immediately.
- Remove it from the affected environment.
- Notify the project maintainer.
- Check whether the key was committed to Git history.

## Responsible Disclosure

Please give the maintainers a reasonable opportunity to investigate and address a vulnerability before publicly disclosing it.

Thank you for helping keep Whiteboard and its contributors safe!
