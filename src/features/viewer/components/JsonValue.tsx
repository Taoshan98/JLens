import React from 'react';
import { HighlightText } from './HighlightText';

interface JsonValueProps {
    type: string;
    value: unknown;
    searchQuery?: string;
}

export const JsonValue: React.FC<JsonValueProps> = React.memo(
    ({ type, value, searchQuery = '' }) => {
        let baseClass = '';
        let valStr = String(value);

        switch (type) {
            case 'string':
                baseClass = 'text-emerald-600 dark:text-emerald-400';
                valStr = `"${valStr}"`;
                break;
            case 'number':
                baseClass = 'text-amber-600 dark:text-amber-400';
                break;
            case 'boolean':
                baseClass = 'text-rose-600 dark:text-rose-400';
                break;
            case 'null':
                baseClass = 'text-muted-foreground';
                valStr = 'null';
                break;
            default:
                return null;
        }

        if (!searchQuery) {
            return <span className={baseClass}>{valStr}</span>;
        }

        return <HighlightText text={valStr} query={searchQuery} className={baseClass} />;
    }
);

JsonValue.displayName = 'JsonValue';
