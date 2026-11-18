import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AlertCircle, Upload } from 'lucide-react';
import { useFormatValidation } from '../hooks/useFormatValidation';
import { useEditorHistory } from '../hooks/useEditorHistory';
import { useCopyFeedback } from '../../../hooks/useCopyFeedback';
import { EditorToolbar } from './EditorToolbar';
import { EditorGutter } from './EditorGutter';
import { EditorStatusBar } from './EditorStatusBar';
import { FormatManager } from '../../../utils/formatManager';
import { formatByteSize } from '../../../utils/guards';
import { Format, FORMATS } from '../../../types/formats';

interface JsonEditorProps {
    onParse: (data: unknown | null, format: Format) => void;
}

const SAMPLE_JSON = `{
  "service": "jlens-explorer",
  "version": "${__APP_VERSION__}",
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
    const [actionError, setActionError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(600);

    const { validation, validate } = useFormatValidation();
    const { canUndo, push: pushHistory, pop: popHistory } = useEditorHistory();
    const { copiedKey, copyText } = useCopyFeedback();

    const gutterRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastEditProgrammaticRef = useRef(false);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setViewportHeight(entry.contentRect.height);
            }
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            void validate(input, userFormat);
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

    const applyProgrammaticUpdate = (nextContent: string, nextFormat?: Format | null) => {
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
        const previous = popHistory();
        if (!previous) return;
        setInput(previous.content);
        setUserFormat(previous.format);
        setActionError(null);
    };

    const resolveActiveFormat = (): Format => userFormat ?? FormatManager.detect(input);

    const handlePrettify = async () => {
        if (!input.trim()) return;
        const activeFormat = resolveActiveFormat();

        try {
            let prettified: string;
            try {
                const parsed = await FormatManager.parseAsync(input, activeFormat);
                prettified = await FormatManager.stringifyAsync(parsed, activeFormat);
            } catch {
                prettified = await FormatManager.stringifyAsync(input, activeFormat);
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

    const handleConvert = async (targetFormat: Format) => {
        if (!input.trim()) return;
        const activeFormat = resolveActiveFormat();

        try {
            const parsed = await FormatManager.parseAsync(input, activeFormat);
            const converted = await FormatManager.convertAsync(parsed, targetFormat);
            applyProgrammaticUpdate(converted, targetFormat);
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : `Unable to convert to ${targetFormat}`
            );
        }
    };

    const handleCopy = async () => {
        const ok = await copyText(input);
        if (ok) {
            setActionError(null);
        } else {
            setActionError('Clipboard write failed. Select text and press Ctrl+C / Cmd+C.');
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                applyProgrammaticUpdate(text, null);
            }
        } catch {
            setActionError('Clipboard read blocked by browser. Paste directly using Ctrl+V / Cmd+V.');
        }
    };

    const loadFileObject = async (file: File) => {
        try {
            const text = await file.text();
            const inferred = formatFromExtension(file.name);
            applyProgrammaticUpdate(text, inferred ?? null);
        } catch {
            setActionError(`Failed to read file "${file.name}".`);
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
        applyProgrammaticUpdate('', null);
    };

    const isEmpty = input.trim() === '';
    const activeFormat = userFormat ?? validation.detectedFormat;
    const convertibleTargets = useMemo(() => {
        if (!validation.isValid) return [];
        return FormatManager.getConvertibleTargets(activeFormat, validation.parsedData);
    }, [validation.isValid, validation.parsedData, activeFormat]);

    const lineCount = useMemo(() => (input ? input.split('\n').length : 1), [input]);
    const byteSizeLabel = useMemo(() => formatByteSize(input), [input]);
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
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) void loadFileObject(file);
                }}
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
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void loadFileObject(file);
                        e.target.value = '';
                    }}
                    className="hidden"
                />

                <EditorToolbar
                    formatState={{
                        currentFormat: userFormat,
                        detectedFormat: validation.detectedFormat,
                        convertibleTargets,
                    }}
                    capabilities={{
                        canFormat: FormatManager.canFormat(activeFormat),
                        canMinify: FormatManager.canMinify(activeFormat),
                        canUndo,
                        isEmpty,
                        isCopied: copiedKey !== null,
                    }}
                    actions={{
                        onPrettify: () => void handlePrettify(),
                        onMinify: handleMinify,
                        onCopy: () => void handleCopy(),
                        onPaste: () => void handlePaste(),
                        onOpenFile: () => fileInputRef.current?.click(),
                        onLoadSample: () => applyProgrammaticUpdate(SAMPLE_JSON, null),
                        onUndo: handleUndo,
                        onDownload: handleDownload,
                        onClear: handleClear,
                        onFormatChange: setUserFormat,
                        onConvert: (target) => void handleConvert(target),
                    }}
                />

                <div className="flex-1 min-h-0 flex overflow-hidden relative">
                    <EditorGutter
                        lineCount={lineCount}
                        scrollTop={scrollTop}
                        viewportHeight={viewportHeight}
                        gutterRef={gutterRef}
                    />

                    <textarea
                        ref={textareaRef}
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
                                canUndo
                            ) {
                                e.preventDefault();
                                handleUndo();
                                lastEditProgrammaticRef.current = false;
                            }
                        }}
                        onScroll={(e) => {
                            const top = e.currentTarget.scrollTop;
                            if (gutterRef.current) {
                                gutterRef.current.style.transform = `translateY(-${top}px)`;
                            }
                            setScrollTop(top);
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

                <EditorStatusBar
                    lineCount={lineCount}
                    byteSizeLabel={byteSizeLabel}
                    isEmpty={isEmpty}
                    isValid={validation.isValid}
                    detectedFormat={validation.detectedFormat}
                />
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
