import {
  FEEDBACK_SYSTEM_PROMPT,
  FEEDBACK_JSON_SCHEMA_DESCRIPTION,
  buildFeedbackUserPrompt,
  CUSTOM_TOPIC_SYSTEM_PROMPT,
  buildCustomTopicUserPrompt,
  TOPIC_POOL_SYSTEM_PROMPT,
  buildTopicPoolUserPrompt,
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
  const trimmed = raw.trim();

  const candidates: string[] = [trimmed];

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) candidates.push(fenced[1].trim());

  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');
  const lastBrace = trimmed.lastIndexOf('}');
  const lastBracket = trimmed.lastIndexOf(']');
  const startCandidates = [firstBrace, firstBracket].filter((i) => i >= 0);
  if (startCandidates.length > 0) {
    const start = Math.min(...startCandidates);
    const endCandidates = [lastBrace, lastBracket].filter((i) => i >= 0);
    if (endCandidates.length > 0) {
      const end = Math.max(...endCandidates);
      if (end > start) candidates.push(trimmed.slice(start, end + 1));
    }
  }

  for (const cand of candidates) {
    try {
      return JSON.parse(cand) as T;
    } catch {
      /* try next */
    }
  }

  const repaired = repairJsonish(trimmed);
  if (repaired) {
    try {
      return JSON.parse(repaired) as T;
    } catch {
      /* fall through */
    }
  }

  throw new AIUnavailableError('Model returned invalid JSON.');
}

/**
 * Best-effort repair for malformed JSON: replace single quotes with double
 * quotes and strip trailing commas. We only run this on output that's
 * *almost* JSON — typical model quirks, not arbitrary text.
 */
function repairJsonish(input: string): string | null {
  let s = input;
  // If neither object nor array braces are present, don't touch it.
  if (!/[{\[]/.test(s)) return null;

  // Walk and convert single-quoted strings to double-quoted ones.
  let out = '';
  let inDouble = false;
  let inSingle = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) {
      out += c;
      escape = false;
      continue;
    }
    if (c === '\\') {
      out += c;
      escape = true;
      continue;
    }
    if (c === '"' && !inSingle) {
      inDouble = !inDouble;
      out += c;
      continue;
    }
    if (c === "'" && !inDouble) {
      inSingle = !inSingle;
      out += '"';
      continue;
    }
    out += c;
  }

  // Strip trailing commas before } or ].
  out = out.replace(/,(\s*[}\]])/g, '$1');
  return out;
}

export async function generateCustomTopic(input: { track: string; difficulty: string }) {
  const raw = await callOpenRouter(CUSTOM_TOPIC_SYSTEM_PROMPT, buildCustomTopicUserPrompt(input));
  return parseJson(raw);
}

export interface GeneratedTopic {
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard';
}

export interface TopicPool {
  topics: GeneratedTopic[];
}

const DIFFICULTIES: GeneratedTopic['difficulty'][] = ['Beginner', 'Intermediate', 'Hard'];

function normalizeDifficulty(value: unknown): GeneratedTopic['difficulty'] {
  if (typeof value === 'string') {
    const v = value.trim();
    if (DIFFICULTIES.includes(v as GeneratedTopic['difficulty'])) {
      return v as GeneratedTopic['difficulty'];
    }
    const lower = v.toLowerCase();
    if (lower.startsWith('begin')) return 'Beginner';
    if (lower.startsWith('hard') || lower.startsWith('adv')) return 'Hard';
    if (lower.startsWith('inter') || lower.startsWith('med')) return 'Intermediate';
  }
  return 'Intermediate';
}

function normalizeTitle(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  // Cap length so the UI doesn't get unwieldy
  return trimmed.length > 240 ? `${trimmed.slice(0, 237)}…` : trimmed;
}

function normalizeTopicPool(raw: unknown): TopicPool {
  const topicsRaw =
    raw && typeof raw === 'object' && Array.isArray((raw as TopicPool).topics)
      ? (raw as TopicPool).topics
      : [];

  const seen = new Set<string>();
  const out: GeneratedTopic[] = [];
  for (const t of topicsRaw) {
    if (!t || typeof t !== 'object') continue;
    const title = normalizeTitle((t as GeneratedTopic).title);
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title, difficulty: normalizeDifficulty((t as GeneratedTopic).difficulty) });
    if (out.length >= 16) break;
  }
  return { topics: out };
}

export async function generateTopicPool(input: {
  track: string;
  count: number;
}): Promise<TopicPool> {
  const raw = await callOpenRouter(
    TOPIC_POOL_SYSTEM_PROMPT,
    buildTopicPoolUserPrompt(input),
  );
  return normalizeTopicPool(parseJson<unknown>(raw));
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
