export class AIUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIUnavailableError';
    }
}
export async function requestFeedback(data: any) {
    const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIUnavailableError(errorData.error || 'Failed to get feedback');
    }
    return response.json();
}
export async function requestCustomTopic(data: any) {
    const response = await fetch('/api/custom-topic', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIUnavailableError(errorData.error || 'Failed to get custom topic');
    }
    return response.json();
}
export interface GeneratedTopic {
    title: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Hard';
    /** One of the track's allowed taxonomy categories (validated server-side). */
    category?: string;
    expectedConcepts?: string[];
}
export interface TopicPoolResponse {
    topics: GeneratedTopic[];
}
export async function requestTopicPool(
    track: string,
    count = 12,
    excludeTitles: string[] = [],
): Promise<TopicPoolResponse> {
    const response = await fetch('/api/topics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ track, count, excludeTitles }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new AIUnavailableError(errorData.error || 'Failed to get topic pool');
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.topics)) {
        throw new AIUnavailableError('Malformed topic pool response.');
    }
    return data as TopicPoolResponse;
}
