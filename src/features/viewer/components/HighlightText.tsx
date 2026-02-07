import React from 'react';

interface HighlightTextProps {
    text: string;
    query: string;
    className?: string; // Base class for the text
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, query, className = '' }) => {
    if (!query) {
        return <span className={className}>{text}</span>;
    }

    const parts = text.split(new RegExp(`(${query})`, 'gi'));

    return (
        <span className={className}>
            {parts.map((part, index) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span key={index} className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground font-bold rounded-[1px] px-[1px]">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};
