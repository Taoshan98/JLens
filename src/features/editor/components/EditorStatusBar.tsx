import React from 'react';
import type { Format } from '../../../types/formats';

interface EditorStatusBarProps {
    lineCount: number;
    byteSizeLabel: string;
    isEmpty: boolean;
    isValid: boolean;
    detectedFormat: Format;
}

export const EditorStatusBar: React.FC<EditorStatusBarProps> = React.memo(
    ({ lineCount, byteSizeLabel, isEmpty, isValid, detectedFormat }) => {
        return (
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/15 text-[11px] shrink-0">
                <span className="font-mono text-muted-foreground">
                    {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {byteSizeLabel}
                </span>
                <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${
                        isEmpty
                            ? 'bg-muted/80 text-muted-foreground/70'
                            : isValid
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-destructive/10 text-destructive'
                    }`}
                >
                    {isEmpty
                        ? 'Empty'
                        : isValid
                        ? `${detectedFormat} (Valid)`
                        : `${detectedFormat} (Invalid)`}
                </span>
            </div>
        );
    }
);

EditorStatusBar.displayName = 'EditorStatusBar';
