import type { AIFeedback, Difficulty, Track } from '../types';
import {
  FEEDBACK_SYSTEM_PROMPT,
  FEEDBACK_JSON_SCHEMA_DESCRIPTION,
  buildFeedbackUserPrompt,
  CUSTOM_TOPIC_SYSTEM_PROMPT,
  buildCustomTopicUserPrompt,
} from './prompts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class AIUnavailableError extends Error {
  constructor(message = 'AI feedback is currently unavailable.') {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

export interface FeedbackRequest {
  topicTitle: string;
  topicHint?: string;
  track: string;
  mode: string;
  transcript: string;
  notes?: string;
}

export interface CustomTopicResult {
  title: string;
  diff: Difficulty;
  researchTime: number;
  presentationTime: number;
}

function getEnv(name: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) return undefined;
  return process.env[name];
}

function getOpenRouterConfig(): { apiKey: string; model: string } {
  const apiKey = getEnv('OPENROUTER_API_KEY')?.trim();
  const model =
    getEnv('OPENROUTER_MODEL')?.trim() ||
    'mistralai/voxtral-small-24b-2507';

  if (!apiKey) {
    throw new AIUnavailableError(
      'AI feedback is currently unavailable. OPENROUTER_API_KEY is not configured.'
    );
  }

  return { apiKey, model };
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('Model response was not valid JSON.');
  }
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const value = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function isAIFeedback(value: unknown): value is AIFeedback {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.overallScore === 'number' &&
    typeof v.technicalAccuracy === 'number' &&
    typeof v.communication === 'number' &&
    typeof v.structure === 'number' &&
    typeof v.confidence === 'number' &&
    Array.isArray(v.strengths) &&
    Array.isArray(v.missingConcepts) &&
    Array.isArray(v.recommendedTopics)
  );
}

export function normalizeFeedback(raw: unknown): AIFeedback {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid feedback payload from model.');
  }
  const v = raw as Record<string, unknown>;
  return {
    overallScore: clamp(v.overallScore, 0, 100, 0),
    technicalAccuracy: clamp(v.technicalAccuracy, 0, 10, 0),
    communication: clamp(v.communication, 0, 10, 0),
    structure: clamp(v.structure, 0, 10, 0),
    confidence: clamp(v.confidence, 0, 10, 0),
    strengths: asStringArray(v.strengths),
    missingConcepts: asStringArray(v.missingConcepts),
    recommendedTopics: asStringArray(v.recommendedTopics),
  };
}

async function openRouterChat(messages: { role: string; content: string }[]): Promise<string> {
  const { apiKey, model } = getOpenRouterConfig();

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': getEnv('APP_URL') || 'http://localhost:3000',
      'X-Title': 'Whiteboard Interview Practice',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('OpenRouter error:', response.status, detail);
    throw new AIUnavailableError(
      'AI feedback is currently unavailable. The model provider returned an error.'
    );
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new AIUnavailableError('AI feedback is currently unavailable. Empty model response.');
  }
  return content;
}

/** Server-side: evaluate a presentation transcript via OpenRouter. */
export async function generateFeedback(input: FeedbackRequest): Promise<AIFeedback> {
  if (!input.transcript?.trim()) {
    throw new Error('Transcript is required for feedback.');
  }

  const content = await openRouterChat([
    {
      role: 'system',
      content: `${FEEDBACK_SYSTEM_PROMPT}\n\n${FEEDBACK_JSON_SCHEMA_DESCRIPTION}`,
    },
    {
      role: 'user',
      content: buildFeedbackUserPrompt(input),
    },
  ]);

  return normalizeFeedback(extractJsonObject(content));
}

/** Server-side: generate a custom interview topic via OpenRouter. */
export async function generateCustomTopic(input: {
  track: Track | string;
  difficulty?: Difficulty | string;
}): Promise<CustomTopicResult> {
  const content = await openRouterChat([
    { role: 'system', content: CUSTOM_TOPIC_SYSTEM_PROMPT },
    {
      role: 'user',
      content: buildCustomTopicUserPrompt({
        track: input.track,
        difficulty: input.difficulty || 'Intermediate',
      }),
    },
  ]);

  const raw = extractJsonObject(content) as Record<string, unknown>;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) {
    throw new AIUnavailableError('AI feedback is currently unavailable. Invalid topic response.');
  }

  const diffRaw = typeof raw.diff === 'string' ? raw.diff : 'Intermediate';
  const diff: Difficulty =
    diffRaw === 'Beginner' || diffRaw === 'Hard' || diffRaw === 'Intermediate'
      ? diffRaw
      : 'Intermediate';

  return {
    title,
    diff,
    researchTime: clamp(raw.researchTime, 3, 20, 10),
    presentationTime: clamp(raw.presentationTime, 1, 10, 3),
  };
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(getEnv('OPENROUTER_API_KEY')?.trim());
}

// ---------------------------------------------------------------------------
// Client helpers — the UI should call only these (never OpenRouter directly).
// ---------------------------------------------------------------------------

export async function requestFeedback(body: {
  topic: { title: string; hint?: string };
  track: string;
  mode: string;
  transcript: string;
  notes?: string;
}): Promise<AIFeedback> {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AIUnavailableError(
      (data as { error?: string }).error || 'AI feedback is currently unavailable.'
    );
  }

  return normalizeFeedback(data);
}

export async function requestCustomTopic(body: {
  track: string;
  difficulty?: string;
}): Promise<CustomTopicResult> {
  const res = await fetch('/api/custom-topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AIUnavailableError(
      (data as { error?: string }).error || 'AI feedback is currently unavailable.'
    );
  }

  const raw = data as Record<string, unknown>;
  const title = typeof raw.title === 'string' ? raw.title : '';
  if (!title) {
    throw new AIUnavailableError('AI feedback is currently unavailable.');
  }

  return {
    title,
    diff:
      raw.diff === 'Beginner' || raw.diff === 'Hard' || raw.diff === 'Intermediate'
        ? raw.diff
        : 'Intermediate',
    researchTime: clamp(raw.researchTime, 3, 20, 10),
    presentationTime: clamp(raw.presentationTime, 1, 10, 3),
  };
}
