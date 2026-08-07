import type { Topic, Track } from '../types';
import frontend from './frontend.json';
import backend from './backend.json';
import cloud from './cloud.json';
import devops from './devops.json';

export interface Question {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Hard';
  tags: string[];
  researchTime: number;
  presentationTime: number;
  hint?: string;
  keyPoints?: string[];
}

const TRACK_BANKS: Record<Track, readonly Question[]> = {
  Frontend: frontend as Question[],
  Backend: backend as Question[],
  'System Design': cloud as Question[],
  DevOps: devops as Question[],
};

export const TRACKS: Track[] = ['Frontend', 'Backend', 'System Design', 'DevOps'];

export function questionToTopic(question: Question, track: Track): Topic {
  return {
    id: question.id,
    title: question.title,
    diff: question.difficulty,
    res: `${question.researchTime} min research`,
    pres: `${question.presentationTime} min presentation`,
    category: track,
    hint: question.hint,
    keyPoints: question.keyPoints,
    tags: question.tags,
    researchTime: question.researchTime,
    presentationTime: question.presentationTime,
  };
}

export function getQuestionsForTrack(track: Track): readonly Question[] {
  return TRACK_BANKS[track] ?? TRACK_BANKS.Frontend;
}

export function getTopicsForTrack(track: Track): Topic[] {
  return getQuestionsForTrack(track).map((q) => questionToTopic(q, track));
}

export function getAllTopics(): Topic[] {
  return TRACKS.flatMap((track) => getTopicsForTrack(track));
}

/**
 * Pick a random topic for a track, avoiding the current id and recently seen ids.
 */
export function pickRandomTopic(
  track: Track,
  options: { excludeId?: string; recentIds?: string[] } = {}
): Topic {
  const pool = getTopicsForTrack(track);
  const { excludeId, recentIds = [] } = options;

  const notCurrent = pool.filter((t) => t.id !== excludeId);
  const fresh = notCurrent.filter((t) => !recentIds.includes(t.id));
  const candidates =
    fresh.length > 0 ? fresh : notCurrent.length > 0 ? notCurrent : pool;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export const MOTIVATIONAL_QUOTES: { quote: string; author: string }[] = [
  { quote: 'The best way to predict the future is to prepare for it.', author: 'Unknown' },
  {
    quote: 'Simple things should be simple, complex things should be possible.',
    author: 'Alan Kay',
  },
  { quote: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  {
    quote: 'Experience is the name everyone gives to their mistakes.',
    author: 'Oscar Wilde',
  },
  {
    quote: 'Clear thinking requires courage rather than intelligence.',
    author: 'Thomas Sowell',
  },
];
