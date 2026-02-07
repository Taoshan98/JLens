import React from 'react';

export interface NodeDetail {
    key: string;
    value: unknown;
    type: string;
    path: string;
}

interface NodeDetailPanelProps {
    selectedNode: NodeDetail | null;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ selectedNode }) => {
    if (!selectedNode) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 bg-muted/5 p-4">
                <p className="text-sm">Select a node to view details</p>
            </div>
        );
    }

    // Identify what rows to show
    // If object/array: Show children
    // If primitive: Show itself (or maybe nothing/parent context? sticking to "Viewer" style usually means showing properties)

    let rows: { name: string; value: string; type: string }[] = [];
    const { value } = selectedNode;

    if (value !== null && typeof value === 'object') {
        rows = Object.entries(value).map(([k, v]) => ({
            name: k,
            value: JSON.stringify(v), // Simplified preview
            type: Array.isArray(v) ? `Array(${v.length})` : typeof v === 'object' && v !== null ? 'Object' : typeof v
        }));

        // Improve value preview for objects/arrays
        rows = rows.map(r => {
            if (r.type.startsWith('Array') || r.type === 'Object') {
                // Keep simple reference or "..."
                return { ...r, value: '...' }; // or strict JSON.stringify but that might be huge
            }
            return r;
        });

        // Actually, let's try to be more precise:
        rows = Object.entries(value).map(([k, v]) => {
            let type: string = typeof v;
            let valStr = String(v);

            if (v === null) {
                type = 'null';
                valStr = 'null';
            } else if (Array.isArray(v)) {
                type = 'array';
                valStr = `Array(${v.length})`;
            } else if (typeof v === 'object') {
                type = 'object';
                valStr = '{...}';
                // Maybe count keys?
                valStr = `Object { ${Object.keys(v).length} keys }`;
            } else {
                // Primitive
                valStr = JSON.stringify(v); // Quotes for strings
            }

            return { name: k, value: valStr, type };
        });

    } else {
        // Primitive selected
        rows = [{
            name: selectedNode.key,
            value: JSON.stringify(value),
            type: typeof value
        }];
    }

    // Sort rows alphabetically? Or keep order? Keep order usually best for arrays, alpha maybe for objects.
    // JLens preference: Simplistic. Keep order.

    return (
        <div className="h-full flex flex-col bg-card border-t border-border/50">
            <div className="px-4 py-2 border-b border-border/50 bg-muted/10 flex items-center justify-between sticky top-0">
                <span className="font-semibold text-xs tracking-wider text-muted-foreground">
                    {selectedNode.path || 'Root'}
                </span>
                <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                    {selectedNode.type}
                </span>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-muted/20 sticky top-0 backdrop-blur-sm">
                        <tr>
                            <th className="p-2 pl-4 font-medium text-muted-foreground w-1/3">Name</th>
                            <th className="p-2 font-medium text-muted-foreground w-1/3">Value</th>
                            <th className="p-2 font-medium text-muted-foreground w-1/3">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-muted/10 transition-colors">
                                <td className="p-2 pl-4 font-mono text-sky-600 dark:text-sky-400">{row.name}</td>
                                <td className="p-2 font-mono text-foreground/80 truncate max-w-[200px]" title={row.value}>{row.value}</td>
                                <td className="p-2 text-muted-foreground text-xs">{row.type}</td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-muted-foreground/50">Empty {selectedNode.type}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
