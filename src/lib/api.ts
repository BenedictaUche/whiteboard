export class AIUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
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
}

export interface TopicPoolResponse {
  topics: GeneratedTopic[];
}

export async function requestTopicPool(
  track: string,
  count = 12
): Promise<TopicPoolResponse> {
  const response = await fetch('/api/topics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ track, count }),
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
