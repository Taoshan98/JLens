import React, { useState } from 'react';

interface JsonNodeProps {
    keyName: string;
    value: unknown;
    depth?: number;
    isLast?: boolean;
}

export const JsonNode: React.FC<JsonNodeProps> = ({
    keyName,
    value,
    depth = 0,
    isLast = true
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const getDataType = (val: unknown): string => {
        if (val === null) return 'null';
        if (Array.isArray(val)) return 'array';
        return typeof val;
    };

    const type = getDataType(value);
    const isObject = type === 'object' || type === 'array';
    const isEmpty = isObject && (value ? Object.keys(value as object).length === 0 : true);

    const toggleExpand = () => {
        if (!isEmpty) {
            setIsExpanded(!isExpanded);
        }
    };

    const renderValue = () => {
        switch (type) {
            case 'string':
                return <span className="text-emerald-600 dark:text-emerald-400">"{String(value)}"</span>;
            case 'number':
                return <span className="text-amber-600 dark:text-amber-400">{String(value)}</span>;
            case 'boolean':
                return <span className="text-violet-600 dark:text-violet-400">{String(value)}</span>;
            case 'null':
                return <span className="text-muted-foreground">null</span>;
            default:
                return null;
        }
    };

    const renderBrackets = (isOpen: boolean) => {
        if (type === 'array') {
            return isOpen ? '[' : ']';
        }
        return isOpen ? '{' : '}';
    };

    return (
        <div className="font-mono text-sm leading-relaxed">
            <div
                className={`flex items-start rounded px-1.5 -ml-1.5 transition-colors duration-100 ${isObject ? 'cursor-pointer select-none hover:bg-accent/50' : 'hover:bg-accent/30'}`}
                style={{ paddingLeft: `${depth * 1.25}rem` }}
                onClick={isObject ? toggleExpand : undefined}
            >
                {/* Toggle indicator */}
                <div className="w-4 h-6 flex items-center justify-center mr-1 text-muted-foreground/60">
                    {isObject && !isEmpty && (
                        <span className={`text-[10px] transition-transform duration-100 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                            ▼
                        </span>
                    )}
                </div>

                {/* Key & Value */}
                <div className="flex-grow flex flex-wrap break-all">
                    {keyName && (
                        <span className="text-sky-600 dark:text-sky-400 mr-1.5">
                            "{keyName}":
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

            {/* Recursive Children */}
            {isObject && isExpanded && !isEmpty && (
                <div>
                    {Object.entries(value as object).map(([k, v], index, arr) => (
                        <JsonNode
                            key={k}
                            keyName={Array.isArray(value) ? '' : k}
                            value={v}
                            depth={depth + 1}
                            isLast={index === arr.length - 1}
                        />
                    ))}
                    <div
                        className="rounded px-1.5 -ml-1.5"
                        style={{ paddingLeft: `${depth * 1.25}rem` }}
                    >
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
