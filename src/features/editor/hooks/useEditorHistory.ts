import { useCallback, useRef, useState } from 'react';
import type { Format } from '../../../types/formats';

export interface HistoryEntry {
    content: string;
    format: Format | undefined;
}

export const DEFAULT_MAX_HISTORY_ENTRIES = 25;
export const DEFAULT_MAX_HISTORY_BYTES = 5 * 1024 * 1024;

export function estimateEntryBytes(entry: HistoryEntry): number {
    return entry.content.length * 2;
}

export function getHistoryBytes(entries: readonly HistoryEntry[]): number {
    return entries.reduce((sum, entry) => sum + estimateEntryBytes(entry), 0);
}

export function pushHistoryEntry(
    entries: readonly HistoryEntry[],
    nextEntry: HistoryEntry,
    maxEntries = DEFAULT_MAX_HISTORY_ENTRIES,
    maxBytes = DEFAULT_MAX_HISTORY_BYTES
): HistoryEntry[] {
    const next = [...entries, nextEntry];
    while (next.length > maxEntries) {
        next.shift();
    }

    let totalBytes = getHistoryBytes(next);
    while (next.length > 1 && totalBytes > maxBytes) {
        const removed = next.shift();
        if (removed) {
            totalBytes -= estimateEntryBytes(removed);
        }
    }

    return next;
}

export function popHistoryEntry(entries: readonly HistoryEntry[]): {
    restored: HistoryEntry | null;
    remaining: HistoryEntry[];
} {
    if (entries.length === 0) {
        return { restored: null, remaining: [] };
    }
    const restored = entries[entries.length - 1];
    return {
        restored,
        remaining: entries.slice(0, -1),
    };
}

export function useEditorHistory(
    maxEntries = DEFAULT_MAX_HISTORY_ENTRIES,
    maxBytes = DEFAULT_MAX_HISTORY_BYTES
) {
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const entriesRef = useRef<HistoryEntry[]>([]);

    const push = useCallback(
        (entry: HistoryEntry) => {
            const next = pushHistoryEntry(entriesRef.current, entry, maxEntries, maxBytes);
            entriesRef.current = next;
            setEntries(next);
        },
        [maxEntries, maxBytes]
    );

    const pop = useCallback((): HistoryEntry | null => {
        const { restored, remaining } = popHistoryEntry(entriesRef.current);
        if (!restored) return null;
        entriesRef.current = remaining;
        setEntries(remaining);
        return restored;
    }, []);

    return {
        entries,
        canUndo: entries.length > 0,
        push,
        pop,
    };
}
