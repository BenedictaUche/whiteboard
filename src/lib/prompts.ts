/**
 * Centralized AI prompts. Models receive only the system instruction,
 * a user payload, and the expected schema description.
 */

export const FEEDBACK_SYSTEM_PROMPT = `You are a senior staff software engineer acting as an interview mentor.
You evaluate a candidate's verbal explanation of a technical topic during a mock interview.

You always respond with a single JSON object that matches the schema provided.
You never include prose outside of that JSON object.
You never invent scores — if the transcript is empty or off-topic, give honest low scores.
You do not flatter. You give specific, actionable feedback.`;

export function buildFeedbackUserPrompt(input: {
  topicTitle: string;
  topicHint?: string;
  track: string;
  mode: string;
  transcript: string;
  notes?: string;
}): string {
  return [
    `Topic: ${input.topicTitle}`,
    `Track: ${input.track}`,
    `Practice Mode: ${input.mode}`,
    `Topic hint (optional context): ${input.topicHint ?? 'n/a'}`,
    `Research notes (optional context): ${input.notes ?? 'n/a'}`,
    ``,
    `Candidate transcript:`,
    input.transcript,
  ].join('\n');
}

export const FEEDBACK_JSON_SCHEMA_DESCRIPTION = `Return a single JSON object with exactly these fields:
{
  "overallScore": number 0-100,
  "technicalAccuracy": number 0-10,
  "communication": number 0-10,
  "structure": number 0-10,
  "confidence": number 0-10,
  "strengths": string[]  (2-4 short bullet phrases),
  "missingConcepts": string[] (1-4 short bullet phrases),
  "recommendedTopics": string[] (2-4 short bullet phrases)
}`;

export const CUSTOM_TOPIC_SYSTEM_PROMPT = `You generate concise technical interview practice topics.
Respond with a single JSON object only — no markdown, no prose.`;

export function buildCustomTopicUserPrompt(input: {
  track: string;
  difficulty: string;
}): string {
  return [
    `Generate one technical interview topic for practice.`,
    `Track: ${input.track}`,
    `Difficulty: ${input.difficulty}`,
    ``,
    `Return JSON with exactly:`,
    `{`,
    `  "title": string (start with Explain / How does / What is / Design),`,
    `  "diff": "Beginner" | "Intermediate" | "Hard",`,
    `  "researchTime": number (minutes, typically 5-15),`,
    `  "presentationTime": number (minutes, typically 2-5)`,
    `}`,
  ].join('\n');
}
