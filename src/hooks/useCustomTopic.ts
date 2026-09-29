import { useMutation } from '@tanstack/react-query';
import type { Track, Topic } from '../types';
import { requestCustomTopic, AIUnavailableError } from '../lib/api';

function formatError(err: unknown): string | null {
    if (!err)
        return null;
    if (err instanceof AIUnavailableError)
        return err.message;
    if (err instanceof Error)
        return err.message;
    return 'AI topic generation is currently unavailable.';
}

export function useCustomTopic(onSuccess: (topic: Topic) => void) {
    const mutation = useMutation({
        mutationFn: (input: { track: Track }) => requestCustomTopic({
            track: input.track,
            difficulty: 'Intermediate',
        }),
        onSuccess: (data, variables) => {
            const newTopic: Topic = {
                id: `custom-${Date.now()}`,
                title: data.title,
                diff: data.difficulty ?? data.diff ?? 'Intermediate',
                res: `${data.researchTime ?? 10} min research`,
                pres: `${data.presentationTime ?? 3} min presentation`,
                category: variables.track,
                hint: 'AI generated custom interview prompt.',
                expectedConcepts: Array.isArray(data.expectedConcepts)
                    ? data.expectedConcepts.filter((c: unknown) => typeof c === 'string')
                    : undefined,
                researchTime: data.researchTime ?? 10,
                presentationTime: data.presentationTime ?? 3,
            };
            onSuccess(newTopic);
        },
    });

    return {
        generateCustomTopic: mutation.mutate,
        isPending: mutation.isPending,
        error: formatError(mutation.error),
    };
}
