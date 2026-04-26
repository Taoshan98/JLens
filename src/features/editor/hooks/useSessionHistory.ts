import { useState, useEffect } from 'react';
import { Format } from '../../../types/formats';

export interface HistoryItem {
    id: string;
    timestamp: number;
    content: string;
    format: Format;
    preview: string;
}

const MAX_HISTORY = 10;
const STORAGE_KEY = 'jlens_history';

export const useSessionHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setHistory(JSON.parse(stored));
            } catch {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }, []);

    const addToHistory = (content: string, format: Format) => {
        if (!content.trim()) return;

        setHistory(prev => {
            // Avoid duplicates at the top
            if (prev.length > 0 && prev[0].content === content) return prev;

            const newItem: HistoryItem = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                content,
                format,
                preview: content.slice(0, 50).replace(/\n/g, ' ') + (content.length > 50 ? '...' : '')
            };

            const newHistory = [newItem, ...prev].slice(0, MAX_HISTORY);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return { history, addToHistory, clearHistory };
};
