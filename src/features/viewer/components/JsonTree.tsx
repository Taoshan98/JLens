import React from 'react';
import { JsonNode } from './JsonNode';
import { Braces } from 'lucide-react';

interface JsonTreeProps {
    data: unknown;
}

export const JsonTree: React.FC<JsonTreeProps> = ({ data }) => {
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
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
            <JsonNode keyName="" value={data} depth={0} isLast={true} />
        </div>
    );
};
