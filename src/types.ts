export type Track = 'Frontend' | 'Backend' | 'System Design' | 'DevOps';
export type Mode = 'Deep Research' | 'Quick Pitch';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Hard';
export interface Topic {
    id: string;
    title: string;
    diff: Difficulty;
    res: string;
    pres: string;
    category: Track;
    /** Structured sub-area from the track taxonomy (AI topics only). */
    topicCategory?: string;
    hint?: string;
    keyPoints?: string[];
    expectedConcepts?: string[];
    tags?: string[];
    researchTime?: number;
    presentationTime?: number;
}
export type AppStep = 'selection' | 'research' | 'presentation' | 'results' | 'feedback' | 'history';
export type Importance = 'low' | 'medium' | 'high';
export interface AIFeedback {
    overallScore: number;
    scores: {
        technicalAccuracy: number;
        conceptCoverage: number;
        communication: number;
        structure: number;
        depth: number;
    };
    summary: string;
    strengths: {
        point: string;
        evidence?: string;
    }[];
    missingConcepts: {
        concept: string;
        importance: Importance;
        explanation: string;
    }[];
    corrections: {
        misconception: string;
        correction: string;
    }[];
    interviewerFollowUp: {
        question: string;
        reason: string;
    };
    nextPractice: {
        instruction: string;
    };
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
