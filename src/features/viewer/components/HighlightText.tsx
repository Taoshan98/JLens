import React from 'react';

interface HighlightTextProps {
    text: string;
    query: string;
    className?: string;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, query, className = '' }) => {
    if (!query) {
        return <span className={className}>{text}</span>;
    }

    const escaped = escapeRegExp(query);
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
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
};
