import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFormatValidation } from '../hooks/useFormatValidation';
import { EditorToolbar } from './EditorToolbar';
import { AlertCircle, Upload } from 'lucide-react';
import { FormatManager } from '../../../utils/formatManager';
import { Format, FORMATS } from '../../../types/formats';

interface JsonEditorProps {
    onParse: (data: unknown | null, format: Format) => void;
}

interface HistoryEntry {
    content: string;
    format: Format | undefined;
}

const SAMPLE_JSON = `{
  "service": "jlens-explorer",
  "version": "1.2.0",
  "clientSideOnly": true,
  "features": [
    { "id": "tree", "name": "Interactive Tree", "enabled": true },
    { "id": "table", "name": "Data Grid", "enabled": true },
    { "id": "schema", "name": "TypeScript & JSON Schema", "enabled": true }
  ],
  "limits": {
    "maxNetworkCalls": 0,
    "privacyMode": "strict"
  }
}`;

const MAX_HISTORY = 25;
const MAX_GUTTER_LINES = 15000;

function formatByteSize(text: string): string {
    const bytes = new Blob([text]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatFromExtension(filename: string): Format | undefined {
    const lower = filename.toLowerCase();
    for (const def of Object.values(FORMATS)) {
        if (def.extensions.some((ext) => lower.endsWith(ext))) {
            return def.id;
        }
    }
    return undefined;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ onParse }) => {
    const [input, setInput] = useState('');
    const [userFormat, setUserFormat] = useState<Format | undefined>(undefined);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const { validation, validate } = useFormatValidation();
    const gutterRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastEditProgrammaticRef = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            validate(input, userFormat);
        }, 300);

        return () => clearTimeout(timer);
    }, [input, userFormat, validate]);

    useEffect(() => {
        if (validation.isValid) {
            onParse(validation.parsedData, validation.detectedFormat);
        } else {
            onParse(null, validation.detectedFormat);
        }
    }, [validation, onParse]);

    const pushHistory = (entry: HistoryEntry) => {
        setHistory((prev) => [...prev.slice(-(MAX_HISTORY - 1)), entry]);
    };

    const applyProgrammaticUpdate = (
        nextContent: string,
        nextFormat?: Format | null
    ) => {
        pushHistory({ content: input, format: userFormat });
        lastEditProgrammaticRef.current = true;
        setInput(nextContent);
        if (nextFormat === null) {
            setUserFormat(undefined);
        } else if (nextFormat !== undefined) {
            setUserFormat(nextFormat);
        }
        setActionError(null);
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        setHistory((prev) => prev.slice(0, -1));
        setInput(previous.content);
        setUserFormat(previous.format);
        setActionError(null);
    };

    const resolveActiveFormat = (): Format => {
        return userFormat ?? FormatManager.detect(input);
    };

    const handlePrettify = () => {
        if (!input.trim()) return;
        const activeFormat = resolveActiveFormat();

        try {
            let prettified: string;
            try {
                const parsed = FormatManager.parse(input, activeFormat);
                prettified = FormatManager.stringify(parsed, activeFormat);
            } catch {
                prettified = FormatManager.stringify(input, activeFormat);
            }

            if (prettified && prettified !== input) {
                applyProgrammaticUpdate(prettified);
            }
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : `Unable to format ${activeFormat}`
            );
        }
    };

    const handleMinify = () => {
        if (!input.trim()) return;
        const activeFormat = resolveActiveFormat();

        try {
            const minified = FormatManager.minify(input, activeFormat);
            if (minified !== input) {
                applyProgrammaticUpdate(minified);
            }
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : `Unable to minify ${activeFormat}`
            );
        }
    };

    const handleConvert = (targetFormat: Format) => {
        if (!input.trim()) return;
        const activeFormat = resolveActiveFormat();

        try {
            const parsed = FormatManager.parse(input, activeFormat);
            const converted = FormatManager.convert(parsed, targetFormat);
            applyProgrammaticUpdate(converted, targetFormat);
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : `Unable to convert to ${targetFormat}`
            );
        }
    };

    const handleCopy = async (): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(input);
            setActionError(null);
            return true;
        } catch {
            setActionError('Clipboard write failed. Select text and press Ctrl+C / Cmd+C.');
            return false;
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                pushHistory({ content: input, format: userFormat });
                lastEditProgrammaticRef.current = true;
                setInput(text);
                setUserFormat(undefined);
                setActionError(null);
            }
        } catch {
            setActionError('Clipboard read blocked by browser. Paste directly using Ctrl+V / Cmd+V.');
        }
    };

    const loadFileObject = async (file: File) => {
        try {
            const text = await file.text();
            const inferredFromExt = formatFromExtension(file.name);
            pushHistory({ content: input, format: userFormat });
            lastEditProgrammaticRef.current = true;
            setInput(text);
            setUserFormat(inferredFromExt);
            setActionError(null);
        } catch {
            setActionError(`Failed to read file "${file.name}".`);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            void loadFileObject(file);
        }
        e.target.value = '';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            void loadFileObject(file);
        }
    };

    const handleDownload = () => {
        if (!input) return;
        const activeFormat = resolveActiveFormat();
        const def = FORMATS[activeFormat];
        const ext = def?.extensions[0] || '.txt';
        const mime = def?.mimeTypes[0] || 'text/plain';
        const blob = new Blob([input], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jlens-export${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        if (!input && userFormat === undefined) return;
        pushHistory({ content: input, format: userFormat });
        lastEditProgrammaticRef.current = true;
        setInput('');
        setUserFormat(undefined);
        setActionError(null);
    };

    const handleLoadSample = () => {
        applyProgrammaticUpdate(SAMPLE_JSON, null);
    };

    const isEmpty = input.trim() === '';
    const activeFormat = userFormat ?? validation.detectedFormat;
    const canFormat = FormatManager.canFormat(activeFormat);
    const canMinify = FormatManager.canMinify(activeFormat);
    const convertibleTargets = useMemo(() => {
        if (!validation.isValid) return [];
        return FormatManager.getConvertibleTargets(activeFormat, validation.parsedData);
    }, [validation.isValid, validation.parsedData, activeFormat]);

    const lineCount = useMemo(() => (input ? input.split('\n').length : 1), [input]);
    const gutterLineCount = Math.min(lineCount, MAX_GUTTER_LINES);
    const gutterWidth = `${Math.max(3, String(lineCount).length + 1.5)}ch`;
    const byteSize = useMemo(() => formatByteSize(input), [input]);

    const displayError = actionError || (!validation.isValid ? validation.error : null);

    return (
        <div className="flex flex-col h-full min-h-0">
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsDragging(false);
                    }
                }}
                onDrop={handleDrop}
                className={`flex-1 min-h-0 flex flex-col relative rounded-lg border bg-card overflow-hidden transition-colors duration-150 ${
                    isDragging
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border focus-within:border-primary/30'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.yaml,.yml,.xml,.toml,.csv,.ini,.env,.jsonl,.ndjson,.md,.markdown,.html,.htm,.sql,.txt"
                    onChange={handleFileInputChange}
                    className="hidden"
                />

                <EditorToolbar
                    onPrettify={handlePrettify}
                    onMinify={handleMinify}
                    onCopy={handleCopy}
                    onPaste={handlePaste}
                    onOpenFile={() => fileInputRef.current?.click()}
                    onLoadSample={handleLoadSample}
                    onUndo={handleUndo}
                    onDownload={handleDownload}
                    onClear={handleClear}
                    onFormatChange={setUserFormat}
                    onConvert={handleConvert}
                    convertibleTargets={convertibleTargets}
                    currentFormat={userFormat}
                    detectedFormat={validation.detectedFormat}
                    canFormat={canFormat}
                    canMinify={canMinify}
                    canUndo={history.length > 0}
                    isEmpty={isEmpty}
                />

                <div className="flex-1 min-h-0 flex overflow-hidden relative">
                    {/* Line Numbers Gutter */}
                    <div
                        className="flex-shrink-0 bg-muted/20 border-r border-border py-4 px-2.5 text-right text-muted-foreground/40 font-mono text-sm select-none overflow-hidden"
                        style={{ width: gutterWidth, boxSizing: 'content-box' }}
                        aria-hidden="true"
                    >
                        <div ref={gutterRef} className="w-full pb-8">
                            {Array.from({ length: gutterLineCount }, (_, i) => (
                                <div key={i} className="leading-6 h-6">
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>

                    <textarea
                        value={input}
                        aria-label="Data editor input"
                        onChange={(e) => {
                            lastEditProgrammaticRef.current = false;
                            setActionError(null);
                            setInput(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (
                                (e.ctrlKey || e.metaKey) &&
                                !e.shiftKey &&
                                e.key.toLowerCase() === 'z' &&
                                lastEditProgrammaticRef.current &&
                                history.length > 0
                            ) {
                                e.preventDefault();
                                handleUndo();
                                lastEditProgrammaticRef.current = false;
                            }
                        }}
                        onScroll={(e) => {
                            if (gutterRef.current) {
                                gutterRef.current.style.transform = `translateY(-${e.currentTarget.scrollTop}px)`;
                            }
                        }}
                        placeholder="Paste content, drop a file, or click Sample..."
                        className="flex-1 w-full p-4 pb-8 whitespace-nowrap resize-none font-mono text-sm leading-6 outline-none bg-transparent text-foreground placeholder:text-muted-foreground/40"
                        spellCheck={false}
                    />

                    {isDragging && (
                        <div className="absolute inset-0 z-20 bg-background/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 border-2 border-dashed border-primary/50 rounded-b-lg pointer-events-none">
                            <Upload className="w-6 h-6 text-primary" />
                            <p className="text-sm font-medium text-foreground">Drop file to inspect</p>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/15 text-[11px] shrink-0">
                    <span className="font-mono text-muted-foreground">
                        {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {byteSize}
                    </span>
                    <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase ${
                            isEmpty
                                ? 'bg-muted/80 text-muted-foreground/70'
                                : validation.isValid
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-destructive/10 text-destructive'
                        }`}
                    >
                        {isEmpty
                            ? 'Empty'
                            : validation.isValid
                            ? `${validation.detectedFormat} (Valid)`
                            : `${validation.detectedFormat} (Invalid)`}
                    </span>
                </div>
            </div>

            {displayError && (
                <div
                    role="alert"
                    className="mt-2 flex items-start gap-2 p-2.5 bg-destructive/5 border border-destructive/20 rounded-md shrink-0"
                >
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive font-mono break-all leading-relaxed">
                        {displayError}
                    </p>
                </div>
            )}
        </div>
    );
};
