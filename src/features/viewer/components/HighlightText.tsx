import React from 'react';

interface HighlightTextProps {
    text: string;
    query: string;
    className?: string;
}

const regexCache = new Map<string, RegExp>();

function getHighlightRegex(query: string): RegExp {
    const cached = regexCache.get(query);
    if (cached) return cached;

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    if (regexCache.size >= 32) {
        const oldestKey = regexCache.keys().next().value;
        if (oldestKey !== undefined) {
            regexCache.delete(oldestKey);
        }
    }
    regexCache.set(query, regex);
    return regex;
}

export const HighlightText: React.FC<HighlightTextProps> = React.memo(
    ({ text, query, className = '' }) => {
        if (!query) {
            return <span className={className}>{text}</span>;
        }

        const regex = getHighlightRegex(query);
        const parts = text.split(regex);
        const lowerQuery = query.toLowerCase();

        return (
            <span className={className}>
                {parts.map((part, index) =>
                    part.toLowerCase() === lowerQuery ? (
                        <span
                            key={index}
                            className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground font-bold rounded-[1px] px-[1px]"
                        >
                            {part}
                        </span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    }
);

HighlightText.displayName = 'HighlightText';
