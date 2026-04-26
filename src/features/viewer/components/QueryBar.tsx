import React from 'react';
import { Search, Info } from 'lucide-react';

interface QueryBarProps {
    query: string;
    onQueryChange: (query: string) => void;
    error?: string | null;
}

export const QueryBar: React.FC<QueryBarProps> = ({ query, onQueryChange, error }) => {
    return (
        <div className="flex flex-col gap-1 pb-2">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                    type="text"
                    className={`w-full bg-card border rounded-md pl-9 pr-4 py-2 text-sm outline-none focus:border-primary transition-colors ${error ? 'border-destructive focus:border-destructive' : 'border-border'}`}
                    placeholder="Filter with JMESPath (e.g. users[?age > 20].name)"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                />
            </div>
            {error ? (
                <div className="text-xs text-destructive px-1">{error}</div>
            ) : (
                <div className="flex justify-between px-1">
                    <a
                        href="https://jmespath.org/tutorial.html"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                        <Info size={10} /> JMESPath Tutorial
                    </a>
                </div>
            )}
        </div>
    );
};
