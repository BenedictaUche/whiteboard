import { useMutation } from '@tanstack/react-query';
import type { AIFeedback } from '../types';
import { requestFeedback, AIUnavailableError } from '../lib/api';

function formatError(err: unknown): string | null {
    if (!err)
        return null;
    if (err instanceof AIUnavailableError)
        return err.message;
    if (err instanceof Error)
        return err.message;
    return 'AI feedback is currently unavailable.';
}

export function useFeedback() {
    const mutation = useMutation({
        mutationFn: requestFeedback,
    });

    return {
        mutateAsync: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: formatError(mutation.error),
        reset: mutation.reset,
    };
}

export type { AIFeedback };
