import React, { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { generateJsonSchema, generateTypeScript } from '../../../utils/typeGenerator';
import { CodeHighlighter } from './CodeHighlighter';
import { useCopyFeedback } from '../../../hooks/useCopyFeedback';

interface SchemaViewProps {
    data: unknown;
}

type SchemaMode = 'typescript' | 'json-schema';

export const SchemaView: React.FC<SchemaViewProps> = ({ data }) => {
    const [mode, setMode] = useState<SchemaMode>('typescript');
    const [rootName, setRootName] = useState('Root');
    const { copiedKey, copyText } = useCopyFeedback();

    const safeRootName = rootName.trim() || 'Root';

    const output = useMemo(() => {
        if (mode === 'typescript') {
            return generateTypeScript(data, safeRootName);
        }
        return generateJsonSchema(data, safeRootName);
    }, [data, mode, safeRootName]);

    return (
        <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-border bg-muted/10 shrink-0">
                <div className="flex items-center gap-1 rounded-md border border-border bg-muted/20 p-0.5">
                    <button
                        type="button"
                        onClick={() => setMode('typescript')}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                            mode === 'typescript'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        TypeScript
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('json-schema')}
                        className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                            mode === 'json-schema'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        JSON Schema
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Root:</span>
                        <input
                            type="text"
                            value={rootName}
                            onChange={(e) => setRootName(e.target.value)}
                            aria-label="Root type name"
                            className="w-24 px-2 py-1 text-xs font-mono bg-muted/20 border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={() => void copyText(output)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-muted/20 hover:bg-accent transition-colors ${
                            copiedKey ? 'text-green-600 dark:text-green-400' : 'text-foreground'
                        }`}
                    >
                        {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-3">
                <CodeHighlighter
                    code={output}
                    language={mode === 'typescript' ? 'typescript' : 'json'}
                    showLineNumbers
                />
            </div>
        </div>
    );
};
