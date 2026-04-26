import React, { useState, useEffect } from 'react';
import { useFormatValidation } from '../hooks/useFormatValidation';
import { EditorToolbar } from './EditorToolbar';
import { AlertCircle } from 'lucide-react';
import { FormatManager } from '../../../utils/formatManager';
import { Format } from '../../../types/formats';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { HistoryDialog } from './HistoryDialog';
import { ImportUrlDialog } from './ImportUrlDialog';

interface EditorProps {
    value?: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    onParse?: (data: unknown | null, format: Format) => void;
}

export const Editor: React.FC<EditorProps> = ({
    value: controlledValue,
    onChange,
    readOnly = false,
    onParse
}) => {
    const [internalInput, setInternalInput] = useState('');

    // Determine the current value (controlled vs uncontrolled)
    const input = controlledValue !== undefined ? controlledValue : internalInput;

    const [userFormat, setUserFormat] = useState<Format | undefined>(undefined); // explicit override
    const { validation, validate } = useFormatValidation();
    const { history, addToHistory, clearHistory } = useSessionHistory();
    const [showHistory, setShowHistory] = useState(false);
    const [showImport, setShowImport] = useState(false);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (controlledValue === undefined) {
            setInternalInput(newValue);
        }
        if (onChange) {
            onChange(newValue);
        }
    };

    // Update input (for internal state or parent notification)
    const updateInput = (newValue: string) => {
        if (controlledValue === undefined) {
            setInternalInput(newValue);
        }
        if (onChange) {
            onChange(newValue);
        }
    };

    // Auto-paste from clipboard on focus if empty (only if not readOnly)
    useEffect(() => {
        if (readOnly) return;

        const checkClipboard = async () => {
            if (input.trim() !== '') return;

            try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim().length > 0) {
                    updateInput(text);
                }
            } catch (err) {
                // Silently fail
            }
        };

        window.addEventListener('focus', checkClipboard);
        checkClipboard();

        return () => window.removeEventListener('focus', checkClipboard);
    }, [input, readOnly]); // controlledValue dependence might be tricky, use input

    // Trigger validation when input or userFormat changes
    useEffect(() => {
        const timer = setTimeout(() => {
            validate(input, userFormat);
        }, 300);

        return () => clearTimeout(timer);
    }, [input, userFormat, validate]);

    // Notify parent of result and save to history
    useEffect(() => {
        if (validation.isValid) {
            if (onParse) {
                onParse(validation.parsedData, validation.detectedFormat);
            }
            // Add to history if valid and not empty, and NOT readonly
            if (input.trim() && !readOnly) {
                const historyTimer = setTimeout(() => {
                    addToHistory(input, validation.detectedFormat);
                }, 1000);
                return () => clearTimeout(historyTimer);
            }
        } else {
            if (onParse) {
                onParse(null, validation.detectedFormat);
            }
        }
    }, [validation, onParse, input, addToHistory, readOnly]);

    const handlePrettify = () => {
        if (readOnly) return;
        try {
            if (validation.parsedData) {
                const prettified = FormatManager.stringify(validation.parsedData, validation.detectedFormat);
                updateInput(prettified);
                return;
            }

            if (validation.detectedFormat === Format.HTML || validation.detectedFormat === Format.SQL) {
                const prettified = FormatManager.stringify(input, validation.detectedFormat);
                updateInput(prettified);
                return;
            }

            const prettified = FormatManager.stringify(input, validation.detectedFormat);
            updateInput(prettified);

        } catch (e) {
            console.warn("Formatting failed", e);
        }
    };

    const handleMinify = () => {
        if (readOnly || !input.trim()) return;
        try {
            if (validation.parsedData && validation.detectedFormat === Format.JSON) {
                const minified = FormatManager.minify(JSON.stringify(validation.parsedData), Format.JSON);
                updateInput(minified);
            } else {
                const minified = FormatManager.minify(input, validation.detectedFormat);
                updateInput(minified);
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
        const mime = 'text/plain';
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
        updateInput('');
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
                    onHistory={() => setShowHistory(true)}
                    onImport={() => setShowImport(true)}
                    onFormatChange={(f) => {
                        if (!f) setUserFormat(undefined);
                        else setUserFormat(f);
                    }}
                    currentFormat={userFormat}
                    detectedFormat={validation.detectedFormat}
                    isValid={validation.isValid}
                    isEmpty={isEmpty}
                    readOnly={readOnly}
                />

                <div className="flex-1 flex overflow-hidden relative">
                    {/* Line Numbers Gutter */}
                    <div
                        className="flex-shrink-0 bg-muted/20 border-r border-border py-4 pl-3 pr-3 text-right text-muted-foreground/30 font-mono text-sm select-none overflow-hidden"
                        style={{ width: '3.5rem' }}
                        aria-hidden="true"
                    >
                        <div id="editor-gutter" className="w-full">
                            {input.split('\n').map((_, i) => (
                                <div key={i} className="leading-6 h-6">{i + 1}</div>
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={input}
                        onChange={handleInputChange}
                        onScroll={(e) => {
                            const gutter = document.getElementById('editor-gutter');
                            if (gutter) {
                                gutter.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`;
                            }
                        }}
                        readOnly={readOnly}
                        placeholder={readOnly ? "No content" : "Paste your content here..."}
                        className={`flex-1 w-full p-4 whitespace-nowrap resize-none font-mono text-sm leading-6 outline-none bg-transparent text-foreground placeholder:text-muted-foreground/40 ${readOnly ? 'cursor-text' : ''}`}
                        spellCheck={false}
                    />
                </div>

                {/* Status badge */}
                <div className={`absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase transition-colors duration-150 backdrop-blur-sm z-10 ${isEmpty
                    ? 'bg-muted/80 text-muted-foreground/60'
                    : validation.isValid
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                    {isEmpty ? 'Empty' : validation.isValid ? `${validation.detectedFormat} (Valid)` : `${validation.detectedFormat} (Invalid)`}
                </div>
            </div>

            {
                !validation.isValid && validation.error && (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive font-mono break-all leading-relaxed">
                            {validation.error}
                        </p>
                    </div>
                )
            }

            <HistoryDialog
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                history={history}
                onRestore={updateInput}
                onClear={clearHistory}
            />

            <ImportUrlDialog
                isOpen={showImport}
                onClose={() => setShowImport(false)}
                onImport={updateInput}
            />
        </div >
    );
};
