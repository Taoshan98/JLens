import React, { useState, useEffect } from 'react';
import Split from 'react-split';
import { Format } from '../../../types/formats';
import { FormatManager } from '../../../utils/formatManager';
import { ArrowRight, Copy, Check, Info } from 'lucide-react';
import { Editor } from '../../editor/components/Editor';

export const ConverterTool: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [inputFormat, setInputFormat] = useState<Format>(Format.TEXT);
    const [targetFormat, setTargetFormat] = useState<Format>(Format.JSON);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Auto-detect input format
    useEffect(() => {
        if (!input.trim()) {
            setInputFormat(Format.TEXT);
            return;
        }
        const detected = FormatManager.detect(input);
        setInputFormat(detected);
    }, [input]);

    // Convert
    useEffect(() => {
        if (!input.trim()) {
            setOutput('');
            setError(null);
            return;
        }

        try {
            // 1. Parse
            const parsed = FormatManager.parse(input, inputFormat);

            if (parsed === null && inputFormat !== Format.TEXT) {
                setError(`Failed to parse ${inputFormat}`);
                setOutput('');
                return;
            }

            // 2. Stringify to target
            const result = FormatManager.stringify(parsed, targetFormat);
            setOutput(result);
            setError(null);

        } catch (e: any) {
            console.error("Conversion failed", e);
            setError(e.message || "Conversion failed");
            setOutput('');
        }
    }, [input, inputFormat, targetFormat]);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const targetFormats = Object.values(Format).filter(f => f !== Format.TEXT);

    return (
        <div className="flex flex-col h-full gap-4 p-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex gap-4 items-center">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        Format Converter
                    </h2>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground uppercase">{inputFormat}</span>
                    <ArrowRight size={14} className="text-muted-foreground" />
                    <select
                        value={targetFormat}
                        onChange={(e) => setTargetFormat(e.target.value as Format)}
                        className="bg-transparent text-xs font-semibold uppercase outline-none text-primary cursor-pointer"
                    >
                        {targetFormats.map(f => (
                            <option key={f} value={f} className="bg-card text-foreground">{f}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        disabled={!output}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
                        title="Copy Output"
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>
            </div>

            <Split
                className="flex flex-1 min-h-0"
                sizes={[50, 50]}
                gutterSize={8}
                gutterAlign="center"
                snapOffset={30}
                dragInterval={1}
                direction="horizontal"
                cursor="col-resize"
            >
                {/* Input */}
                <div className="h-full flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase flex justify-between">
                        <span>Input</span>
                        {error && <span className="text-destructive normal-case flex items-center gap-1"><Info size={12} /> {error}</span>}
                    </label>
                    <div className="flex-1 min-h-0">
                        <Editor
                            value={input}
                            onChange={setInput}
                        />
                    </div>
                </div>

                {/* Output */}
                <div className="h-full flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Output ({targetFormat})</label>
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
