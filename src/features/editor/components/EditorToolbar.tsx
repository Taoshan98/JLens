import React, { useState } from 'react';
import {
    Copy,
    Download,
    Trash2,
    Maximize2,
    Minimize2,
    Check,
    ClipboardPaste,
    FolderOpen,
    Undo2,
    Sparkles,
    ArrowRightLeft,
} from 'lucide-react';
import { FormatSelector } from './FormatSelector';
import { Format, FORMATS } from '../../../types/formats';

interface EditorToolbarProps {
    onPrettify: () => void;
    onMinify: () => void;
    onCopy: () => Promise<boolean> | boolean;
    onPaste: () => void;
    onOpenFile: () => void;
    onLoadSample: () => void;
    onUndo: () => void;
    onDownload: () => void;
    onClear: () => void;
    onFormatChange: (format: Format | undefined) => void;
    onConvert: (targetFormat: Format) => void;
    convertibleTargets: Format[];
    currentFormat: Format | undefined;
    detectedFormat: Format;
    canFormat: boolean;
    canMinify: boolean;
    canUndo: boolean;
    isEmpty: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    onPrettify,
    onMinify,
    onCopy,
    onPaste,
    onOpenFile,
    onLoadSample,
    onUndo,
    onDownload,
    onClear,
    onFormatChange,
    onConvert,
    convertibleTargets,
    currentFormat,
    detectedFormat,
    canFormat,
    canMinify,
    canUndo,
    isEmpty,
}) => {
    const [copyFeedback, setCopyFeedback] = useState(false);

    const activeFormat = currentFormat ?? detectedFormat;
    const activeFormatName = FORMATS[activeFormat]?.name || 'Text';

    const handleCopy = async () => {
        const ok = await onCopy();
        if (ok !== false) {
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 1500);
        }
    };

    const buttonBase =
        'inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors duration-150';
    const buttonEnabled =
        'text-foreground/80 hover:text-foreground hover:bg-accent active:scale-[0.98]';
    const buttonDisabled = 'text-muted-foreground/40 cursor-not-allowed';

    return (
        <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 border-b border-border bg-muted/20">
            <div className="flex flex-wrap items-center gap-1">
                <FormatSelector
                    value={currentFormat}
                    onChange={onFormatChange}
                    detectedFormat={detectedFormat}
                />
                <div className="w-px h-4 bg-border mx-0.5" />
                <button
                    type="button"
                    onClick={onPrettify}
                    disabled={isEmpty || !canFormat}
                    title={`Format ${activeFormatName}`}
                    aria-label={`Format ${activeFormatName}`}
                    className={`${buttonBase} ${
                        isEmpty || !canFormat ? buttonDisabled : buttonEnabled
                    }`}
                >
                    <Maximize2 size={13} />
                    <span className="hidden sm:inline">Format</span>
                </button>
                <button
                    type="button"
                    onClick={onMinify}
                    disabled={isEmpty || !canMinify}
                    title={`Minify ${activeFormatName}`}
                    aria-label={`Minify ${activeFormatName}`}
                    className={`${buttonBase} ${
                        isEmpty || !canMinify ? buttonDisabled : buttonEnabled
                    }`}
                >
                    <Minimize2 size={13} />
                    <span className="hidden sm:inline">Minify</span>
                </button>

                {convertibleTargets.length > 0 && (
                    <>
                        <div className="w-px h-4 bg-border mx-0.5" />
                        <div className="relative flex items-center">
                            <ArrowRightLeft
                                size={12}
                                className="absolute left-2 text-muted-foreground pointer-events-none"
                            />
                            <select
                                value=""
                                aria-label="Convert to another format"
                                title="Convert data to another format"
                                onChange={(e) => {
                                    const target = e.target.value as Format;
                                    if (target) onConvert(target);
                                }}
                                className="appearance-none bg-transparent dark:bg-zinc-900 pl-6 pr-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 cursor-pointer rounded-md border border-border/60"
                            >
                                <option value="">Convert...</option>
                                {convertibleTargets.map((targetId) => (
                                    <option key={targetId} value={targetId}>
                                        → {FORMATS[targetId].name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-1">
                {isEmpty && (
                    <button
                        type="button"
                        onClick={onLoadSample}
                        title="Load sample JSON"
                        aria-label="Load sample JSON"
                        className={`${buttonBase} text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10`}
                    >
                        <Sparkles size={13} />
                        <span>Sample</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={onPaste}
                    title="Paste from clipboard"
                    aria-label="Paste from clipboard"
                    className={`${buttonBase} ${buttonEnabled}`}
                >
                    <ClipboardPaste size={13} />
                    <span className="hidden md:inline">Paste</span>
                </button>
                <button
                    type="button"
                    onClick={onOpenFile}
                    title="Open local file"
                    aria-label="Open local file"
                    className={`${buttonBase} ${buttonEnabled}`}
                >
                    <FolderOpen size={13} />
                </button>
                <button
                    type="button"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo last action"
                    aria-label="Undo last action"
                    className={`${buttonBase} ${!canUndo ? buttonDisabled : buttonEnabled}`}
                >
                    <Undo2 size={13} />
                </button>
                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={isEmpty}
                    title="Copy to clipboard"
                    aria-label="Copy to clipboard"
                    className={`${buttonBase} ${isEmpty ? buttonDisabled : buttonEnabled} ${
                        copyFeedback ? 'text-green-600 dark:text-green-400' : ''
                    }`}
                >
                    {copyFeedback ? <Check size={13} /> : <Copy size={13} />}
                    <span className="hidden sm:inline">{copyFeedback ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                    type="button"
                    onClick={onDownload}
                    disabled={isEmpty}
                    title={`Download as ${FORMATS[activeFormat]?.extensions[0] || '.txt'}`}
                    aria-label="Download as file"
                    className={`${buttonBase} ${isEmpty ? buttonDisabled : buttonEnabled}`}
                >
                    <Download size={13} />
                </button>
                <div className="w-px h-4 bg-border/50 mx-0.5" />
                <button
                    type="button"
                    onClick={onClear}
                    disabled={isEmpty}
                    title="Clear editor"
                    aria-label="Clear editor"
                    className={`${buttonBase} ${
                        isEmpty
                            ? buttonDisabled
                            : 'text-destructive/70 hover:text-destructive hover:bg-destructive/10 active:scale-[0.98]'
                    }`}
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
};
