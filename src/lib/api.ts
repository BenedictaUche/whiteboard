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

export async function generateCustomTopic({ track, difficulty }: { track: string; difficulty: string }) {
  const response = await fetch('/api/custom-topic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ track, difficulty }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AIUnavailableError(errorData.error || 'Failed to get custom topic');
  }

  return response.json();
}
