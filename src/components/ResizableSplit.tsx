import React, { useRef, useState } from 'react';

interface ResizableSplitProps {
    direction: 'horizontal' | 'vertical';
    initialRatio?: number;
    minFirstPx?: number;
    minSecondPx?: number;
    gutterSize?: number;
    ariaLabel?: string;
    className?: string;
    first: React.ReactNode;
    second: React.ReactNode;
}

export const ResizableSplit: React.FC<ResizableSplitProps> = ({
    direction,
    initialRatio = 0.5,
    minFirstPx = 140,
    minSecondPx = 120,
    gutterSize = 10,
    ariaLabel = 'Resize panels',
    className = '',
    first,
    second,
}) => {
    const [ratio, setRatio] = useState(initialRatio);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isHorizontal = direction === 'horizontal';

    const updateRatioFromClientPos = (clientX: number, clientY: number) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const totalSize = isHorizontal ? rect.width : rect.height;
        if (totalSize <= minFirstPx + minSecondPx + gutterSize) return;

        const offset = isHorizontal ? clientX - rect.left : clientY - rect.top;
        const maxFirst = totalSize - minSecondPx - gutterSize;
        const clampedFirst = Math.min(Math.max(offset, minFirstPx), maxFirst);
        const nextRatio = Math.min(Math.max(clampedFirst / totalSize, 0.08), 0.92);
        setRatio(nextRatio);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        updateRatioFromClientPos(e.clientX, e.clientY);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        setIsDragging(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const decKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
        const incKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

        if (e.key === decKey) {
            e.preventDefault();
            setRatio((prev) => Math.max(0.1, Number((prev - 0.03).toFixed(3))));
        } else if (e.key === incKey) {
            e.preventDefault();
            setRatio((prev) => Math.min(0.9, Number((prev + 0.03).toFixed(3))));
        } else if (e.key === 'Home') {
            e.preventDefault();
            setRatio(0.2);
        } else if (e.key === 'End') {
            e.preventDefault();
            setRatio(0.8);
        }
    };

    const firstStyle: React.CSSProperties = {
        flexBasis: `calc(${ratio * 100}% - ${gutterSize / 2}px)`,
        flexGrow: 0,
        flexShrink: 0,
    };

    const gutterStyle: React.CSSProperties = isHorizontal
        ? { width: `${gutterSize}px`, height: '100%' }
        : { height: `${gutterSize}px`, width: '100%' };

    return (
        <div
            ref={containerRef}
            className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} ${
                isDragging ? 'select-none' : ''
            } ${className}`}
        >
            <div style={firstStyle} className="min-w-0 min-h-0 overflow-hidden flex flex-col">
                {first}
            </div>

            <div
                role="separator"
                tabIndex={0}
                aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
                aria-valuenow={Math.round(ratio * 100)}
                aria-valuemin={10}
                aria-valuemax={90}
                aria-label={ariaLabel}
                style={gutterStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={() => setRatio(initialRatio)}
                onKeyDown={handleKeyDown}
                className={`gutter focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
                    isHorizontal ? 'gutter-horizontal' : 'gutter-vertical'
                }`}
            />

            <div className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
                {second}
            </div>
        </div>
    );
};
