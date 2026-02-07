import React from 'react';
import { JsonNode } from './JsonNode';
import { Braces } from 'lucide-react';

import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useJsonSearch } from '../hooks/useJsonSearch';

interface JsonTreeProps {
    data: unknown;
    selectedPath?: string | null;
    onSelect?: (path: string, value: unknown, key: string) => void;
}

export const JsonTree: React.FC<JsonTreeProps> = ({ data, selectedPath, onSelect }) => {
    // Search Hook Internalized
    const {
        query,
        setQuery,
        matches,
        currentMatchIndex,
        nextMatch,
        prevMatch,
        activeMatch
    } = useJsonSearch(data);

    if (data === null) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground border border-dashed border-border/60 rounded-lg bg-muted/20">
                <div className="p-3 rounded-lg bg-muted/50 mb-3">
                    <Braces size={24} className="text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/70">No data to display</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Paste valid JSON to preview</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden json-tree-container">
            {/* Integrated Search Toolbar */}
            <div className="flex items-center gap-2 p-2 border-b border-border bg-muted/10 shrink-0">
                <div className="relative flex-1">
                    <div className="absolute left-2.5 top-2.5 text-muted-foreground/50">
                        <Search size={14} />
                    </div>
                    <input
                        type="text"
                        placeholder="Find in tree..."
                        className="w-full pl-8 pr-16 py-1.5 text-xs bg-muted/20 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
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
                        <div className="absolute right-2 top-1.5 flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground mr-1">
                                {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : '0/0'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 border border-border rounded-md bg-muted/20 p-0.5">
                    <button
                        onClick={prevMatch}
                        disabled={matches.length === 0}
                        className="p-1 hover:bg-muted/30 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Previous Match (Shift+Enter)"
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button
                        onClick={nextMatch}
                        disabled={matches.length === 0}
                        className="p-1 hover:bg-muted/30 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Next Match (Enter)"
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <JsonNode
                    keyName=""
                    value={data}
                    depth={0}
                    isLast={true}
                    path="root"
                    selectedPath={selectedPath}
                    onSelect={onSelect}
                    searchQuery={query}
                    activeMatchPath={activeMatch?.path}
                />
            </div>
        </div>
    );
};
