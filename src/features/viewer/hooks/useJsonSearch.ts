import { useState, useMemo, useCallback } from 'react';
import { appendPointer } from '../../../utils/jsonPath';

export interface SearchMatch {
    path: string;
    key: string;
    value: string;
}

function formatMatchPreview(val: unknown): string {
    if (val === null) return 'null';
    if (Array.isArray(val)) return `Array(${val.length})`;
    if (typeof val === 'object') return `Object(${Object.keys(val).length})`;
    return String(val);
}

export const useJsonSearch = (data: unknown) => {
    const [query, setQuery] = useState('');
    const [navState, setNavState] = useState<{
        dataRef: unknown;
        query: string;
        index: number;
    }>({
        dataRef: data,
        query: '',
        index: 0,
    });

    const matches = useMemo<SearchMatch[]>(() => {
        if (!query || data === null || data === undefined) {
            return [];
        }

        const found: SearchMatch[] = [];
        const lowerQuery = query.toLowerCase();

        const traverse = (
            val: unknown,
            currentPath: string,
            keyName: string,
            isParentArray: boolean
        ) => {
            if (!isParentArray && keyName && keyName.toLowerCase().includes(lowerQuery)) {
                found.push({
                    path: currentPath,
                    key: keyName,
                    value: formatMatchPreview(val),
                });
            } else if (val !== null && val !== undefined && typeof val !== 'object') {
                if (String(val).toLowerCase().includes(lowerQuery)) {
                    found.push({
                        path: currentPath,
                        key: keyName,
                        value: String(val),
                    });
                }
            }

            if (val !== null && typeof val === 'object') {
                const isArrayVal = Array.isArray(val);
                Object.entries(val).forEach(([k, v]) => {
                    traverse(v, appendPointer(currentPath, k), k, isArrayVal);
                });
            }
        };

        traverse(data, '', '', false);
        return found;
    }, [data, query]);

    const currentMatchIndex = useMemo(() => {
        if (matches.length === 0) return -1;
        if (navState.dataRef !== data || navState.query !== query) return 0;
        return ((navState.index % matches.length) + matches.length) % matches.length;
    }, [matches.length, navState, data, query]);

    const nextMatch = useCallback(() => {
        if (matches.length === 0) return;
        setNavState((prev) => {
            const base = prev.dataRef === data && prev.query === query ? prev.index : 0;
            return {
                dataRef: data,
                query,
                index: (base + 1) % matches.length,
            };
        });
    }, [matches.length, data, query]);

    const prevMatch = useCallback(() => {
        if (matches.length === 0) return;
        setNavState((prev) => {
            const base = prev.dataRef === data && prev.query === query ? prev.index : 0;
            return {
                dataRef: data,
                query,
                index: (base - 1 + matches.length) % matches.length,
            };
        });
    }, [matches.length, data, query]);

    return {
        query,
        setQuery,
        matches,
        currentMatchIndex,
        nextMatch,
        prevMatch,
        activeMatch: currentMatchIndex >= 0 ? matches[currentMatchIndex] || null : null,
    };
};
