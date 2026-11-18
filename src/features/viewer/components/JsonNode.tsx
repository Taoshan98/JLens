import React, { useState, useEffect, useRef } from 'react';
import { HighlightText } from './HighlightText';
import { JsonValue } from './JsonValue';
import { appendPointer, isAncestorPointer } from '../../../utils/jsonPath';

export interface ExpansionSignal {
    id: number;
    expanded: boolean;
}

interface JsonNodeProps {
    keyName: string;
    value: unknown;
    depth?: number;
    isLast?: boolean;
    path?: string;
    selectedPath?: string | null;
    onSelect?: (path: string, value: unknown, key: string) => void;
    searchQuery?: string;
    activeMatchPath?: string | null;
    expansionSignal?: ExpansionSignal;
}

const PAGE_SIZE = 100;

function getDataType(val: unknown): string {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    return typeof val;
}

function isRelevantPath(nodePath: string, targetPath: string | null | undefined): boolean {
    if (targetPath === null || targetPath === undefined) return false;
    return targetPath === nodePath || isAncestorPointer(nodePath, targetPath);
}

const JsonNodeComponent: React.FC<JsonNodeProps> = ({
    keyName,
    value,
    depth = 0,
    isLast = true,
    path = '',
    selectedPath,
    onSelect,
    searchQuery = '',
    activeMatchPath = null,
    expansionSignal,
}) => {
    const type = getDataType(value);
    const isObject = type === 'object' || type === 'array';
    const entries = isObject && value ? Object.entries(value as object) : [];
    const isEmpty = isObject && entries.length === 0;

    const defaultExpanded = depth < 2 || (depth < 4 && entries.length <= 12);
    const currentSignalId = expansionSignal?.id ?? 0;

    const [toggleState, setToggleState] = useState<{
        signalId: number;
        expanded: boolean;
        collapsedMatchPath: string | null;
    }>(() => ({
        signalId: currentSignalId,
        expanded: expansionSignal ? expansionSignal.expanded : defaultExpanded,
        collapsedMatchPath: null,
    }));

    const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
    const nodeRef = useRef<HTMLDivElement>(null);

    const currentPath = path;
    const isSelected = selectedPath === currentPath;
    const isActiveMatch = activeMatchPath !== null && activeMatchPath === currentPath;
    const isAncestorOfActiveMatch = Boolean(
        activeMatchPath && isObject && !isEmpty && isAncestorPointer(currentPath, activeMatchPath)
    );

    const baseExpanded =
        expansionSignal && toggleState.signalId !== expansionSignal.id
            ? expansionSignal.expanded
            : toggleState.expanded;
    const forceExpandForMatch =
        isAncestorOfActiveMatch && toggleState.collapsedMatchPath !== activeMatchPath;
    const isExpanded = baseExpanded || forceExpandForMatch;

    let effectiveLimit = visibleLimit;
    if (isAncestorOfActiveMatch && activeMatchPath) {
        const matchChildIndex = entries.findIndex(([k]) => {
            const childPtr = appendPointer(currentPath, k);
            return childPtr === activeMatchPath || isAncestorPointer(childPtr, activeMatchPath);
        });
        if (matchChildIndex >= effectiveLimit) {
            effectiveLimit = matchChildIndex + 20;
        }
    }

    const visibleEntries = entries.slice(0, effectiveLimit);
    const remainingCount = entries.length - visibleEntries.length;

    useEffect(() => {
        if (isActiveMatch && nodeRef.current) {
            nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isActiveMatch]);

    const setManualExpand = (nextExpanded: boolean) => {
        setToggleState({
            signalId: currentSignalId,
            expanded: nextExpanded,
            collapsedMatchPath:
                !nextExpanded && isAncestorOfActiveMatch ? activeMatchPath : null,
        });
    };

    const handleExpandToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEmpty) {
            setManualExpand(!isExpanded);
        }
    };

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.getSelection()?.toString()) return;
        onSelect?.(currentPath, value, keyName || 'root');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onSelect?.(currentPath, value, keyName || 'root');
        } else if (e.key === 'ArrowRight' && isObject && !isEmpty && !isExpanded) {
            e.preventDefault();
            e.stopPropagation();
            setManualExpand(true);
        } else if (e.key === 'ArrowLeft' && isObject && !isEmpty && isExpanded) {
            e.preventDefault();
            e.stopPropagation();
            setManualExpand(false);
        }
    };

    const renderBrackets = (isOpen: boolean) => {
        if (type === 'array') return isOpen ? '[' : ']';
        return isOpen ? '{' : '}';
    };

    return (
        <div className="font-mono text-sm leading-relaxed">
            <div
                ref={nodeRef}
                role="treeitem"
                tabIndex={0}
                aria-expanded={isObject && !isEmpty ? isExpanded : undefined}
                aria-selected={isSelected}
                onKeyDown={handleKeyDown}
                onClick={handleSelect}
                className={`flex items-start rounded px-1.5 -ml-1.5 transition-colors duration-100 json-node-row focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50
                    ${isSelected ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-accent/40'}
                    ${isActiveMatch ? 'ring-2 ring-yellow-400/60 bg-yellow-400/10' : ''}
                    ${isObject ? 'cursor-pointer' : ''}`}
                style={{ paddingLeft: `calc(${depth * 1.25}rem + 2rem)` }}
            >
                <button
                    type="button"
                    tabIndex={-1}
                    aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
                    disabled={!isObject || isEmpty}
                    onClick={isObject && !isEmpty ? handleExpandToggle : undefined}
                    className="w-4 h-6 flex items-center justify-center mr-1 text-muted-foreground/60 hover:text-foreground cursor-pointer disabled:cursor-default shrink-0"
                >
                    {isObject && !isEmpty && (
                        <span
                            className={`text-[10px] transition-transform duration-100 ${
                                isExpanded ? 'rotate-0' : '-rotate-90'
                            }`}
                        >
                            ▼
                        </span>
                    )}
                </button>

                <div className="flex-grow flex flex-wrap break-all select-text">
                    {keyName && (
                        <span className="text-sky-600 dark:text-sky-400 mr-1.5">
                            <HighlightText text={`"${keyName}"`} query={searchQuery} />:
                        </span>
                    )}

                    {isObject ? (
                        <span className="text-foreground/70">
                            {renderBrackets(true)}
                            {!isExpanded && (
                                <span className="text-muted-foreground/60 px-1 text-xs">
                                    {entries.length} {entries.length === 1 ? 'item' : 'items'}
                                </span>
                            )}
                        </span>
                    ) : (
                        <JsonValue type={type} value={value} searchQuery={searchQuery} />
                    )}

                    {!isExpanded && isObject && (
                        <span className="text-foreground/70">
                            {renderBrackets(false)}
                            {!isLast && <span className="text-muted-foreground/50">,</span>}
                        </span>
                    )}
                    {isObject && isExpanded && isEmpty && (
                        <span className="text-foreground/70">
                            {renderBrackets(false)}
                            {!isLast && <span className="text-muted-foreground/50">,</span>}
                        </span>
                    )}
                    {!isObject && !isLast && <span className="text-muted-foreground/50">,</span>}
                </div>
            </div>

            {isObject && isExpanded && !isEmpty && (
                <div role="group">
                    {visibleEntries.map(([k, v], index) => (
                        <JsonNode
                            key={k}
                            keyName={Array.isArray(value) ? '' : k}
                            value={v}
                            depth={depth + 1}
                            isLast={index === entries.length - 1}
                            path={appendPointer(currentPath, k)}
                            selectedPath={selectedPath}
                            onSelect={onSelect}
                            searchQuery={searchQuery}
                            activeMatchPath={activeMatchPath}
                            expansionSignal={expansionSignal}
                        />
                    ))}

                    {remainingCount > 0 && (
                        <div
                            className="flex items-center gap-2 py-1 text-xs"
                            style={{ paddingLeft: `calc(${(depth + 1) * 1.25}rem + 3.25rem)` }}
                        >
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setVisibleLimit(effectiveLimit + PAGE_SIZE);
                                }}
                                className="px-2 py-0.5 rounded border border-border bg-muted/30 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Show {Math.min(PAGE_SIZE, remainingCount)} more ({remainingCount} remaining)
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setVisibleLimit(entries.length);
                                }}
                                className="px-2 py-0.5 rounded border border-border bg-muted/30 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Show all ({entries.length})
                            </button>
                        </div>
                    )}

                    <div
                        className="rounded px-1.5 -ml-1.5 json-node-row relative"
                        style={{ paddingLeft: `calc(${depth * 1.25}rem + 3.5rem)` }}
                    >
                        <div className="flex">
                            <div className="w-4 mr-1" />
                            <div className="text-foreground/70">
                                {renderBrackets(false)}
                                {!isLast && <span className="text-muted-foreground/50">,</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const JsonNode = React.memo(JsonNodeComponent, (prev, next) => {
    if (
        prev.keyName !== next.keyName ||
        prev.value !== next.value ||
        prev.depth !== next.depth ||
        prev.isLast !== next.isLast ||
        prev.path !== next.path ||
        prev.onSelect !== next.onSelect ||
        prev.searchQuery !== next.searchQuery ||
        prev.expansionSignal !== next.expansionSignal
    ) {
        return false;
    }

    const nodePath = next.path ?? '';
    if (prev.selectedPath !== next.selectedPath) {
        if (
            isRelevantPath(nodePath, prev.selectedPath) ||
            isRelevantPath(nodePath, next.selectedPath)
        ) {
            return false;
        }
    }

    if (prev.activeMatchPath !== next.activeMatchPath) {
        if (
            isRelevantPath(nodePath, prev.activeMatchPath) ||
            isRelevantPath(nodePath, next.activeMatchPath)
        ) {
            return false;
        }
    }

    return true;
});

JsonNode.displayName = 'JsonNode';
