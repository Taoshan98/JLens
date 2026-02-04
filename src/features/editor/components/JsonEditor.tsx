import React, { useState, useEffect } from 'react';
import { useJsonValidation } from '../hooks/useJsonValidation';
import { EditorToolbar } from './EditorToolbar';
import { AlertCircle } from 'lucide-react';

interface JsonEditorProps {
    onParse: (data: unknown | null) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ onParse }) => {
    const [input, setInput] = useState('');
    const { validation, validate } = useJsonValidation();

    useEffect(() => {
        const timer = setTimeout(() => {
            validate(input);
        }, 300);

        return () => clearTimeout(timer);
    }, [input, validate]);

    useEffect(() => {
        if (validation.isValid) {
            onParse(validation.parsedData);
        } else {
            onParse(null);
        }
    }, [validation, onParse]);

    const handlePrettify = () => {
        if (validation.parsedData) {
            const prettified = JSON.stringify(validation.parsedData, null, 2);
            setInput(prettified);
        }
    };

    const handleMinify = () => {
        if (validation.parsedData) {
            const minified = JSON.stringify(validation.parsedData);
            setInput(minified);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(input);
    };

    const handleDownload = () => {
        if (!input) return;
        const blob = new Blob([input], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jlens-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setInput('');
    };

    const isEmpty = input.trim() === '';

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col relative rounded-lg border border-border bg-card overflow-hidden focus-within:border-primary/30 transition-colors duration-150">

                <EditorToolbar
                    onPrettify={handlePrettify}
                    onMinify={handleMinify}
                    onCopy={handleCopy}
                    onDownload={handleDownload}
                    onClear={handleClear}
                    isValid={validation.isValid}
                    isEmpty={isEmpty}
                />

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste or type JSON here..."
                    className="flex-1 w-full p-4 resize-none font-mono text-sm outline-none bg-transparent text-foreground placeholder:text-muted-foreground/40"
                    spellCheck={false}
                />

                {/* Status badge */}
                <div className={`absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase transition-colors duration-150 ${isEmpty
                        ? 'bg-muted text-muted-foreground/60'
                        : validation.isValid
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-destructive/10 text-destructive'
                    }`}>
                    {isEmpty ? 'Empty' : validation.isValid ? 'Valid' : 'Invalid'}
                </div>
            </div>

            {/* Error message */}
            {!validation.isValid && validation.error && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive font-mono break-all leading-relaxed">
                        {validation.error}
                    </p>
                </div>
            )}
        </div>
    );
};
