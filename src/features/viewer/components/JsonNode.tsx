import React, { useState, useEffect, useRef } from 'react';
import { HighlightText } from './HighlightText';

interface JsonNodeProps {
    keyName: string;
    value: unknown;
    depth?: number;
    isLast?: boolean;
    path?: string; // Current path
    selectedPath?: string | null;
    onSelect?: (path: string, value: unknown, key: string) => void;
    searchQuery?: string;
    activeMatchPath?: string | null; // The path of the currently "FOCUSED via search" node
}

export const JsonNode: React.FC<JsonNodeProps> = ({
    keyName,
    value,
    depth = 0,
    isLast = true,
    path = '',
    selectedPath,
    onSelect,
    searchQuery = '',
    activeMatchPath
}) => {
    const [isExpanded, setIsExpanded] = useState(true); // Default to expanded? Or closed? Usually closed.
    // NOTE: The previous code had `useState(true)`. Let's stick to true for now or user preference? 
    // Usually large JSONs start collapsed at root matching level? 
    // Let's stick to default behavior (expanded) or maybe `depth < 2`?
    // The user didn't specify, but "auto-expand" implies they might be closed.

    // We'll keep default true for root, maybe? Previous code: `useState(true)`.

    const nodeRef = useRef<HTMLDivElement>(null);

    const getDataType = (val: unknown): string => {
        if (val === null) return 'null';
        if (Array.isArray(val)) return 'array';
        return typeof val;
    };

    const type = getDataType(value);
    const isObject = type === 'object' || type === 'array';
    const isEmpty = isObject && (value ? Object.keys(value as object).length === 0 : true);

    // Current full path for this node.
    // FIX: Rely on the passed 'path' prop as the definitive full path for THIS node.
    // If not provided (root), fallback to 'root'.
    const currentPath = path || 'root';

    const isSelected = selectedPath === currentPath;
    const isActiveMatch = activeMatchPath === currentPath;

    // Auto-Expand if we are an ancestor of the activeMatchPath
    // We match if activeMatchPath starts with our path + "."
    useEffect(() => {
        if (activeMatchPath && isObject && !isEmpty) {
            // If we are strictly the parent/ancestor.
            // e.g. active="root.a.b", current="root.a" -> startsWith("root.a") is true.
            // But we only want to expand if it's strictly deeper.
            if (activeMatchPath.startsWith(currentPath + '.')) {
                setIsExpanded(true);
            }
        }
    }, [activeMatchPath, currentPath, isObject, isEmpty]);

    // Scroll into view if we are the active match
    useEffect(() => {
        if (isActiveMatch && nodeRef.current) {
            nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isActiveMatch]);


    const handleExpandToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isEmpty) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(currentPath, value, keyName || 'root');
    };

    const renderValue = () => {
        if (!searchQuery) {
            switch (type) {
                case 'string': return <span className="text-emerald-600 dark:text-emerald-400">"{String(value)}"</span>;
                case 'number': return <span className="text-amber-600 dark:text-amber-400">{String(value)}</span>;
                case 'boolean': return <span className="text-violet-600 dark:text-violet-400">{String(value)}</span>;
                case 'null': return <span className="text-muted-foreground">null</span>;
                default: return null;
            }
        } else {
            // Highlighted rendering
            let baseClass = "";
            let valStr = String(value);

            switch (type) {
                case 'string':
                    baseClass = "text-emerald-600 dark:text-emerald-400";
                    valStr = `"${valStr}"`;
                    break;
                case 'number': baseClass = "text-amber-600 dark:text-amber-400"; break;
                case 'boolean': baseClass = "text-violet-600 dark:text-violet-400"; break;
                case 'null': baseClass = "text-muted-foreground"; valStr = "null"; break;
            }
            return <HighlightText text={valStr} query={searchQuery} className={baseClass} />;
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
                className={`flex items-start rounded px-1.5 -ml-1.5 transition-colors duration-100 json-node-row
                    ${isSelected ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-accent/40'} 
                    ${isActiveMatch ? 'ring-2 ring-yellow-400/50 bg-yellow-400/10' : ''}
                    ${isObject ? 'cursor-pointer' : ''}`}
                style={{ paddingLeft: `calc(${depth * 1.25}rem + 2rem)` }}
                onClick={handleSelect}
            >
                {/* Toggle */}
                <div
                    className="w-4 h-6 flex items-center justify-center mr-1 text-muted-foreground/60 hover:text-foreground cursor-pointer"
                    onClick={isObject ? handleExpandToggle : undefined}
                >
                    {isObject && !isEmpty && (
                        <span className={`text-[10px] transition-transform duration-100 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                            ▼
                        </span>
                    )}
                </div>

                {/* Key & Value */}
                <div className="flex-grow flex flex-wrap break-all pointer-events-none">
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
                                    {Array.isArray(value) ? (value as unknown[]).length : Object.keys(value as object).length} items
                                </span>
                            )}
                        </span>
                    ) : (
                        renderValue()
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

            {/* Children */}
            {isObject && isExpanded && !isEmpty && (
                <div>
                    {Object.entries(value as object).map(([k, v], index, arr) => (
                        <JsonNode
                            key={k}
                            keyName={Array.isArray(value) ? '' : k}
                            value={v}
                            depth={depth + 1}
                            isLast={index === arr.length - 1}
                            path={`${currentPath}.${k}`}
                            selectedPath={selectedPath}
                            onSelect={onSelect}
                            searchQuery={searchQuery}
                            activeMatchPath={activeMatchPath}
                        />
                    ))}
                    <div className="rounded px-1.5 -ml-1.5 json-node-row relative" style={{ paddingLeft: `calc(${depth * 1.25}rem + 3.5rem)` }}>
                        <div className="flex">
                            <div className="w-4 mr-1"></div>
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
