import React, { useState } from 'react';
import { JsonNode, type ExpansionSignal } from './JsonNode';
import {
    Braces,
    Search,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    ChevronsDownUp,
    X,
} from 'lucide-react';
import { useJsonSearch } from '../hooks/useJsonSearch';

interface JsonTreeProps {
    data: unknown;
    selectedPath?: string | null;
    onSelect?: (path: string, value: unknown, key: string) => void;
}

export const JsonTree: React.FC<JsonTreeProps> = ({ data, selectedPath, onSelect }) => {
    const {
        query,
        setQuery,
        matches,
        currentMatchIndex,
        nextMatch,
        prevMatch,
        activeMatch,
    } = useJsonSearch(data);

    const [expansionSignal, setExpansionSignal] = useState<ExpansionSignal | undefined>(undefined);

    const triggerExpansion = (expanded: boolean) => {
        setExpansionSignal((prev) => ({
            id: (prev?.id ?? 0) + 1,
            expanded,
        }));
    };

    if (data === null || data === undefined) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground border border-dashed border-border/60 rounded-lg bg-muted/20">
                <div className="p-3 rounded-lg bg-muted/50 mb-3">
                    <Braces size={24} className="text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/70">No data to display</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Paste valid data to preview</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden json-tree-container">
            {/* Search & Expand Controls Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b border-border bg-muted/10 shrink-0">
                <div className="relative flex-1">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none">
                        <Search size={14} />
                    </div>
                    <input
                        type="text"
                        placeholder="Find in tree..."
                        aria-label="Find in tree"
                        className="w-full pl-8 pr-20 py-1.5 text-xs bg-muted/20 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (e.shiftKey) prevMatch();
                                else nextMatch();
                            }
                        }}
                    />
                    {query && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                                {matches.length > 0
                                    ? `${currentMatchIndex + 1}/${matches.length}`
                                    : '0/0'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                                className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-0.5 border border-border rounded-md bg-muted/20 p-0.5">
                    <button
                        type="button"
                        onClick={prevMatch}
                        disabled={matches.length === 0}
                        className="p-1 hover:bg-muted/30 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Previous Match (Shift+Enter)"
                        aria-label="Previous match"
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={nextMatch}
                        disabled={matches.length === 0}
                        className="p-1 hover:bg-muted/30 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Next Match (Enter)"
                        aria-label="Next match"
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>

                <div className="flex items-center gap-0.5 border border-border rounded-md bg-muted/20 p-0.5">
                    <button
                        type="button"
                        onClick={() => triggerExpansion(true)}
                        className="p-1 hover:bg-muted/30 rounded text-muted-foreground hover:text-foreground"
                        title="Expand All"
                        aria-label="Expand all nodes"
                    >
                        <ChevronsUpDown size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => triggerExpansion(false)}
                        className="p-1 hover:bg-muted/30 rounded text-muted-foreground hover:text-foreground"
                        title="Collapse All"
                        aria-label="Collapse all nodes"
                    >
                        <ChevronsDownUp size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4" role="tree" aria-label="Structured data tree">
                <JsonNode
                    keyName=""
                    value={data}
                    depth={0}
                    isLast={true}
                    path=""
                    selectedPath={selectedPath}
                    onSelect={onSelect}
                    searchQuery={query}
                    activeMatchPath={activeMatch ? activeMatch.path : null}
                    expansionSignal={expansionSignal}
                />
            </div>
        </div>
    );
};
