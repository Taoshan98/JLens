import React from 'react';

interface EditorGutterProps {
    lineCount: number;
    scrollTop: number;
    viewportHeight: number;
    gutterRef: React.RefObject<HTMLDivElement | null>;
}

const LINE_HEIGHT_PX = 24;
const VERTICAL_PADDING_TOP = 16;
const VERTICAL_PADDING_BOTTOM = 32;
const OVERSCAN_LINES = 12;

export const EditorGutter: React.FC<EditorGutterProps> = React.memo(
    ({ lineCount, scrollTop, viewportHeight, gutterRef }) => {
        const safeLineCount = Math.max(1, lineCount);
        const gutterWidth = `${Math.max(3, String(safeLineCount).length + 1.5)}ch`;

        const startLine = Math.max(
            0,
            Math.floor(Math.max(0, scrollTop - VERTICAL_PADDING_TOP) / LINE_HEIGHT_PX) -
                OVERSCAN_LINES
        );
        const visibleCount =
            Math.ceil((viewportHeight || 600) / LINE_HEIGHT_PX) + OVERSCAN_LINES * 2;
        const endLine = Math.min(safeLineCount, startLine + visibleCount);

        const totalHeight =
            safeLineCount * LINE_HEIGHT_PX + VERTICAL_PADDING_TOP + VERTICAL_PADDING_BOTTOM;

        return (
            <div
                className="flex-shrink-0 bg-muted/20 border-r border-border px-2.5 text-right text-muted-foreground/40 font-mono text-sm select-none overflow-hidden"
                style={{ width: gutterWidth, boxSizing: 'content-box' }}
                aria-hidden="true"
            >
                <div
                    ref={gutterRef}
                    className="relative w-full"
                    style={{
                        height: `${totalHeight}px`,
                        transform: `translateY(-${scrollTop}px)`,
                    }}
                >
                    <div
                        className="absolute left-0 right-0"
                        style={{ top: `${VERTICAL_PADDING_TOP + startLine * LINE_HEIGHT_PX}px` }}
                    >
                        {Array.from({ length: Math.max(0, endLine - startLine) }, (_, idx) => {
                            const lineNumber = startLine + idx + 1;
                            return (
                                <div key={lineNumber} className="leading-6 h-6">
                                    {lineNumber}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
);

EditorGutter.displayName = 'EditorGutter';
