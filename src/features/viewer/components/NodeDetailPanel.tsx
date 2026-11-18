import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toJqPath, toJsonPath } from '../../../utils/jsonPath';

export interface NodeDetail {
    key: string;
    value: unknown;
    type: string;
    path: string;
}

interface NodeDetailPanelProps {
    selectedNode: NodeDetail | null;
    rootData?: unknown;
}

type CopiedTarget = 'path' | 'jq' | 'value' | null;

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ selectedNode, rootData }) => {
    const [copiedTarget, setCopiedTarget] = useState<CopiedTarget>(null);

    const jsonPath = useMemo(() => {
        if (!selectedNode) return '$';
        return toJsonPath(selectedNode.path, rootData);
    }, [selectedNode, rootData]);

    const jqPath = useMemo(() => {
        if (!selectedNode) return '.';
        return toJqPath(selectedNode.path, rootData);
    }, [selectedNode, rootData]);

    const rows = useMemo(() => {
        if (!selectedNode) return [];
        const { value } = selectedNode;

        if (value !== null && typeof value === 'object') {
            return Object.entries(value).map(([k, v]) => {
                let type: string = typeof v;
                let valStr: string;

                if (v === null) {
                    type = 'null';
                    valStr = 'null';
                } else if (Array.isArray(v)) {
                    type = 'array';
                    valStr = `Array(${v.length})`;
                } else if (typeof v === 'object') {
                    type = 'object';
                    valStr = `Object { ${Object.keys(v).length} keys }`;
                } else {
                    valStr = JSON.stringify(v);
                }

                return { name: k, value: valStr, type };
            });
        }

        const leafType = value === null ? 'null' : typeof value;
        return [
            {
                name: selectedNode.key,
                value: JSON.stringify(value),
                type: leafType,
            },
        ];
    }, [selectedNode]);

    if (!selectedNode) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 bg-muted/5 p-4">
                <p className="text-sm">Select a node to view details</p>
            </div>
        );
    }

    const handleCopy = async (target: Exclude<CopiedTarget, null>, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedTarget(target);
            setTimeout(() => setCopiedTarget(null), 1500);
        } catch {
            /* ignore clipboard errors */
        }
    };

    const serializedValue =
        typeof selectedNode.value === 'string'
            ? selectedNode.value
            : JSON.stringify(selectedNode.value, null, 2);

    return (
        <div className="h-full flex flex-col bg-card border-t border-border/50">
            <div className="px-3 py-2 border-b border-border/50 bg-muted/10 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10">
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className="font-mono font-semibold text-xs text-foreground/90 truncate"
                        title={`${jsonPath} (jq: ${jqPath})`}
                    >
                        {jsonPath}
                    </span>
                    <span className="text-[11px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded shrink-0">
                        {selectedNode.type}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => handleCopy('path', jsonPath)}
                        title={`Copy JSONPath: ${jsonPath}`}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-border bg-muted/20 hover:bg-accent transition-colors ${
                            copiedTarget === 'path' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {copiedTarget === 'path' ? <Check size={11} /> : <Copy size={11} />}
                        <span>Path</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCopy('jq', jqPath)}
                        title={`Copy jq selector: ${jqPath}`}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-border bg-muted/20 hover:bg-accent transition-colors ${
                            copiedTarget === 'jq' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {copiedTarget === 'jq' ? <Check size={11} /> : <Copy size={11} />}
                        <span>jq</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCopy('value', serializedValue)}
                        title="Copy node value"
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border border-border bg-muted/20 hover:bg-accent transition-colors ${
                            copiedTarget === 'value' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {copiedTarget === 'value' ? <Check size={11} /> : <Copy size={11} />}
                        <span>Value</span>
                    </button>
                </div>
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
                            <tr key={`${row.name}-${idx}`} className="hover:bg-muted/10 transition-colors">
                                <td className="p-2 pl-4 font-mono text-sky-600 dark:text-sky-400">
                                    {row.name}
                                </td>
                                <td
                                    className="p-2 font-mono text-foreground/80 truncate max-w-[200px]"
                                    title={row.value}
                                >
                                    {row.value}
                                </td>
                                <td className="p-2 text-muted-foreground text-xs">{row.type}</td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-4 text-center text-muted-foreground/50">
                                    Empty {selectedNode.type}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
