import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Track, Topic, DrillRecord } from '../types';
import {
    ensureTopicPool,
    refillPool,
    consumePooledTopic,
    poolNeedsRefill,
    recordConsumedTitles,
    pickFromPool,
    pickLocalFallback,
    invalidateTopicPool,
    getCachedPool,
    type CachedPool,
} from '../lib/topicPool';

export interface UseTopicPoolResult {
    pool: CachedPool | null;
    topics: Topic[];
    isLoading: boolean;
    error: string | null;
    pickNext: (excludeId: string, recentIds: string[]) => Topic | null;
    pickInitial: (recentIds: string[]) => Topic | null;
    consume: (topicId: string, bank: Topic[]) => void;
    refresh: () => Promise<void>;
}

export function useTopicPool(track: Track, history: DrillRecord[]): UseTopicPoolResult {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['topic-pool', track],
        queryFn: () => ensureTopicPool(track, { history }),
        staleTime: Infinity,
        gcTime: 10 * 60 * 1000,
    });

    const pool = getCachedPool(track) ?? query.data ?? null;

    const topics = useMemo(() => pool?.topics ?? [], [pool]);

    const pickInitial = (recentIds: string[]): Topic | null => {
        const cached = getCachedPool(track);
        if (!cached || cached.topics.length === 0)
            return null;
        return pickFromPool(cached, '', recentIds) ?? cached.topics[0];
    };

    const pickNext = (excludeId: string, recentIds: string[]): Topic | null => {
        const cached = getCachedPool(track);
        const next = (cached ? pickFromPool(cached, excludeId, recentIds) : null) ??
            cached?.topics[0] ??
            pickLocalFallback(track, excludeId, recentIds);
        return next;
    };

    const consume = (topicId: string, bank: Topic[]) => {
        consumePooledTopic(track, topicId);
        recordConsumedTitles(track, bank);
        if (poolNeedsRefill(track)) {
            void refillPool(track, { history }).then((fresh) => {
                queryClient.setQueryData(['topic-pool', track], fresh);
            });
        }
    };

    const refresh = async () => {
        invalidateTopicPool(track);
        await queryClient.fetchQuery({
            queryKey: ['topic-pool', track],
            queryFn: () => refillPool(track, { history }),
        });
    };

    return {
        pool,
        topics,
        isLoading: query.isLoading,
        error: query.error instanceof Error
            ? query.error.message
            : query.error
                ? 'Topic generation failed.'
                : null,
        pickNext,
        pickInitial,
        consume,
        refresh,
    };
}
