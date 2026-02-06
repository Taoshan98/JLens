import React, { useState, useEffect } from 'react';
import { useFormatValidation } from '../hooks/useFormatValidation';
import { EditorToolbar } from './EditorToolbar';
import { AlertCircle } from 'lucide-react';
import { FormatManager } from '../../../utils/formatManager';
import { Format } from '../../../types/formats';

interface JsonEditorProps {
    onParse: (data: unknown | null, format: Format) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ onParse }) => {
    const [input, setInput] = useState('');
    const [userFormat, setUserFormat] = useState<Format | undefined>(undefined); // explicit override
    const { validation, validate } = useFormatValidation();

    // Trigger validation when input or userFormat changes
    useEffect(() => {
        const timer = setTimeout(() => {
            validate(input, userFormat);
        }, 300);

        return () => clearTimeout(timer);
    }, [input, userFormat, validate]);

    // Notify parent of result
    useEffect(() => {
        if (validation.isValid) {
            onParse(validation.parsedData, validation.detectedFormat);
        } else {
            onParse(null, validation.detectedFormat);
        }
    }, [validation, onParse]);

    const handlePrettify = () => {
        // Attempt to prettify regardless of validation state (best effort)
        try {
            // Case 1: We have valid parsed data (JSON, YAML, XML, etc.)
            if (validation.parsedData) {
                const prettified = FormatManager.stringify(validation.parsedData, validation.detectedFormat);
                setInput(prettified);
                return;
            }

            // Case 2: No parsed data, but it's a string-based format (HTML, SQL)
            if (validation.detectedFormat === Format.HTML || validation.detectedFormat === Format.SQL) {
                const prettified = FormatManager.stringify(input, validation.detectedFormat);
                setInput(prettified);
                return;
            }

            // Case 3: Invalid data (JSON/YAML)
            // If it's invalid, we should NOT try to parse it strictly first, because that will throw and bypass the repair logic.
            // FormatManager.stringify is designed to handle raw strings for YAML to attempt repair.

            // For JSON, we might still want to try 'parse' to see if it works loosely? 
            // My FormatManager.stringify(string) for JSON tries to parse and catch.
            // So we can just universally call stringify with the input string if we don't have parsedData.

            const prettified = FormatManager.stringify(input, validation.detectedFormat);
            setInput(prettified);

        } catch (e) {
            // If completely fails, we just don't update input.
            // Optional: User feedback could be added here, but the Error badge is already showing.
            console.warn("Formatting failed", e);
        }
    };

    const handleMinify = () => {
        if (!input.trim()) return;

        // Minify logic
        try {
            if (validation.parsedData && validation.detectedFormat === Format.JSON) {
                // Efficient JSON minify
                const minified = FormatManager.minify(JSON.stringify(validation.parsedData), Format.JSON);
                setInput(minified);
            } else {
                // For SQL, HTML, XML, or even invalid content if we can regex it
                // FormatManager.minify uses regex for SQL/HTML/XML so it works on strings!
                // For JSON, if invalid, minify logic does: try parse? catch return original.

                const minified = FormatManager.minify(input, validation.detectedFormat);
                setInput(minified);
            }
        } catch (e) {
            console.warn("Minification failed", e);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(input);
    };

    const handleDownload = () => {
        if (!input) return;
        const ext = validation.detectedFormat === Format.TEXT ? 'txt' : validation.detectedFormat;
        const mime = 'text/plain'; // Simplification, could get mime types from FORMATS
        const blob = new Blob([input], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jlens-export.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setInput('');
        setUserFormat(undefined);
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
                    onFormatChange={(f) => {
                        // If user selects empty/auto (though selector usually has values), handle it.
                        // My selector has value="" for Auto.
                        if (!f) setUserFormat(undefined);
                        else setUserFormat(f);
                    }}
                    currentFormat={userFormat}
                    detectedFormat={validation.detectedFormat}
                    isValid={validation.isValid}
                    isEmpty={isEmpty}
                />

                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste your content here..."
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
                    {isEmpty ? 'Empty' : validation.isValid ? `${validation.detectedFormat} (Valid)` : `${validation.detectedFormat} (Invalid)`}
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
