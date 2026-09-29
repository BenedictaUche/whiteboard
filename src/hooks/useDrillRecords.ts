import { useCallback, useEffect, useState } from 'react';
import type { DrillRecord } from '../types';

const STORAGE_KEY = 'Whiteboard_records';

function isLegacyFeedback(value: unknown): boolean {
    if (!value || typeof value !== 'object')
        return true;
    const v = value as Record<string, unknown>;
    if (!v.scores || typeof v.scores !== 'object')
        return true;
    return false;
}

function loadDrillRecords(): DrillRecord[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved)
            return [];
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter((r) => r && r.feedback && !isLegacyFeedback(r.feedback)) as DrillRecord[];
    }
    catch {
        return [];
    }
}

export function useDrillRecords() {
    const [records, setRecords] = useState<DrillRecord[]>(loadDrillRecords);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        }
        catch {
        }
    }, [records]);

    const addRecord = useCallback((record: DrillRecord) => {
        setRecords((prev) => [record, ...prev]);
    }, []);

    const clearRecords = useCallback(() => {
        setRecords([]);
    }, []);

    return { records, addRecord, clearRecords };
}
