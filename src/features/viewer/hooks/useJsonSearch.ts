import { useState, useEffect, useCallback } from 'react';

export interface SearchMatch {
    path: string;
    key: string;
    value: string;
}

export const useJsonSearch = (data: unknown) => {
    const [query, setQuery] = useState('');
    const [matches, setMatches] = useState<SearchMatch[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    // Search function to find all matches
    useEffect(() => {
        if (!query || !data) {
            setMatches([]);
            setCurrentMatchIndex(-1);
            return;
        }

        const found: SearchMatch[] = [];
        const lowerQuery = query.toLowerCase();

        const traverse = (val: unknown, currentPath: string, keyName: string) => {
            // 1. Check Key
            if (keyName && keyName.toLowerCase().includes(lowerQuery)) {
                found.push({ path: currentPath, key: keyName, value: String(val) });
            }
            // 2. Check Value (if primitive)
            else if (val !== null && typeof val !== 'object') {
                if (String(val).toLowerCase().includes(lowerQuery)) {
                    found.push({ path: currentPath, key: keyName, value: String(val) });
                }
            }

            // 3. Recurse
            if (val !== null && typeof val === 'object') {
                Object.entries(val).forEach(([k, v]) => {
                    const nextPath = currentPath ? `${currentPath}.${k}` : k;
                    traverse(v, nextPath, k);
                });
            }
        };

        // Start traversal
        // Root is special, usually we don't match "root" name unless explicitly handled, 
        // but let's assume we start checking children of root if root is object/array.
        // Or if data itself is a primitive match?

        traverse(data, 'root', '');

        setMatches(found);
        setCurrentMatchIndex(found.length > 0 ? 0 : -1);

    }, [data, query]);

    const nextMatch = useCallback(() => {
        if (matches.length === 0) return;
        setCurrentMatchIndex(prev => (prev + 1) % matches.length);
    }, [matches]);

    const prevMatch = useCallback(() => {
        if (matches.length === 0) return;
        setCurrentMatchIndex(prev => (prev - 1 + matches.length) % matches.length);
    }, [matches]);

    return {
        query,
        setQuery,
        matches,
        currentMatchIndex,
        nextMatch,
        prevMatch,
        activeMatch: matches[currentMatchIndex] || null
    };
};
