import {
  FEEDBACK_SYSTEM_PROMPT,
  FEEDBACK_JSON_SCHEMA_DESCRIPTION,
  buildFeedbackUserPrompt,
  CUSTOM_TOPIC_SYSTEM_PROMPT,
  buildCustomTopicUserPrompt,
} from './prompts.js';

export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'mistralai/voxtral-small-24b-2507';

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AIUnavailableError('OpenRouter is not configured.');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new AIUnavailableError(`OpenRouter request failed (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new AIUnavailableError('OpenRouter returned an empty response.');
  }
  return content;
}

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new AIUnavailableError('Model returned invalid JSON.');
  }
}

export async function generateCustomTopic(input: { track: string; difficulty: string }) {
  const raw = await callOpenRouter(CUSTOM_TOPIC_SYSTEM_PROMPT, buildCustomTopicUserPrompt(input));
  return parseJson(raw);
}

export async function generateFeedback(input: {
  topicTitle: string;
  topicHint?: string;
  track: string;
  mode: string;
  transcript: string;
  is_custom: boolean;
  notes?: string;
}) {
  const raw = await callOpenRouter(
    `${FEEDBACK_SYSTEM_PROMPT}\n\n${FEEDBACK_JSON_SCHEMA_DESCRIPTION}`,
    buildFeedbackUserPrompt(input),
  );
  return parseJson(raw);
}
