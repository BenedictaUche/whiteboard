export type Track = 'Frontend' | 'Backend' | 'System Design' | 'DevOps';
export type Mode = 'Deep Research' | 'Quick Pitch';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Hard';

export interface Topic {
  id: string;
  title: string;
  diff: Difficulty;
  res: string; // e.g., "10 min research"
  pres: string; // e.g., "3 min presentation"
  category: Track;
  hint?: string;
  keyPoints?: string[];
  tags?: string[];
  researchTime?: number;
  presentationTime?: number;
}

export type AppStep =
  | 'selection'
  | 'research'
  | 'presentation'
  | 'results'
  | 'feedback'
  | 'history';

/** Structured JSON returned by the AI mentor (OpenRouter). */
export interface AIFeedback {
  overallScore: number; // 0–100
  technicalAccuracy: number; // 0–10
  communication: number; // 0–10
  structure: number; // 0–10
  confidence: number; // 0–10
  strengths: string[];
  missingConcepts: string[];
  recommendedTopics: string[];
}

export interface DrillRecord {
  id: string;
  timestamp: number;
  topic: Topic;
  track: Track;
  mode: Mode;
  researchNotes: string;
  transcript: string;
  feedback: AIFeedback;
}

export type Theme = 'cream' | 'dark' | 'sage';
