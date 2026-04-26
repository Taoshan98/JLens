import React, { useState, useEffect } from 'react';
import Split from 'react-split';
import {
    quicktype,
    InputData,
    jsonInputForTargetLanguage
} from 'quicktype-core';
import { Copy, Check } from 'lucide-react';
import { Editor } from '../../editor/components/Editor';

const LANGUAGES = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'go', label: 'Go' },
    { value: 'python', label: 'Python' },
    { value: 'rust', label: 'Rust' },
    { value: 'csharp', label: 'C#' },
    { value: 'java', label: 'Java' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'dart', label: 'Dart' },
];

export const CodeGenTool: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [language, setLanguage] = useState('typescript');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const generate = async () => {
            if (!input.trim()) {
                setOutput('');
                setError(null);
                return;
            }

            try {
                // Validate JSON first
                JSON.parse(input);
                setError(null);
            } catch (e) {
                // Don't generate if invalid JSON
                return;
            }

            setLoading(true);
            try {
                const jsonInput = jsonInputForTargetLanguage(language as any);
                await jsonInput.addSource({
                    name: "GeneratedType",
                    samples: [input]
                });

                const inputData = new InputData();
                inputData.addInput(jsonInput);

                const result = await quicktype({
                    inputData,
                    lang: language as any,
                    rendererOptions: { "just-types": "true" }
                });

                setOutput(result.lines.join('\n'));
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Generation failed');
                setOutput('');
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(generate, 500);
        return () => clearTimeout(timeout);
    }, [input, language]);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full gap-4 p-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex gap-4 items-center">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        Type Generator
                    </h2>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-card border border-border rounded-md px-2 py-1 text-sm outline-none focus:border-primary"
                    >
                        {LANGUAGES.map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        disabled={!output}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
                        title="Copy to Clipboard"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
            </div>

            <Split
                className="flex flex-1 min-h-0"
                sizes={[40, 60]}
                gutterSize={8}
                gutterAlign="center"
                snapOffset={30}
                dragInterval={1}
                direction="horizontal"
                cursor="col-resize"
            >
                {/* Input */}
                <div className="h-full flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">JSON Input</label>
                    <div className="flex-1 min-h-0">
                        <Editor
                            value={input}
                            onChange={setInput}
                        />
                    </div>
                    {error && (
                        <div className="text-xs text-destructive mt-1">{error}</div>
                    )}
                </div>

                {/* Output */}
                <div className="h-full flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-muted-foreground uppercase">Generated {language} Code</label>
                        {loading && <span className="text-xs text-primary animate-pulse">Generating...</span>}
                    </div>
                    <div className="flex-1 min-h-0">
                        <Editor
                            value={output}
                            readOnly={true}
                        />
                    </div>
                </div>
            </Split>
        </div>
    );
};
