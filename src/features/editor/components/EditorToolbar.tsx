import React, { useState } from 'react';
import { Copy, Download, Trash2, Maximize2, Minimize2, Check } from 'lucide-react';
import { FormatSelector } from './FormatSelector';
import { Format } from '../../../types/formats';

interface EditorToolbarProps {
    onPrettify: () => void;
    onMinify: () => void;
    onCopy: () => void;
    onDownload: () => void;
    onClear: () => void;
    onFormatChange: (format: Format) => void;
    currentFormat: Format | undefined;
    detectedFormat: Format;
    isValid: boolean;
    isEmpty: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    onPrettify,
    onMinify,
    onCopy,
    onDownload,
    onClear,
    onFormatChange,
    currentFormat,
    detectedFormat,
    // isValid - unused now
    isEmpty,
}) => {
    const [copyFeedback, setCopyFeedback] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 1500);
    };

    const buttonBase = "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150";
    const buttonEnabled = "text-foreground/80 hover:text-foreground hover:bg-accent active:scale-[0.98]";
    const buttonDisabled = "text-muted-foreground/40 cursor-not-allowed";

    return (
        <div className="flex items-center justify-between p-2 border-b border-border bg-muted/20">
            <div className="flex items-center gap-1">
                <FormatSelector
                    value={currentFormat}
                    onChange={onFormatChange}
                    detectedFormat={detectedFormat}
                />
                <div className="w-px h-4 bg-border mx-1" />
                <button
                    onClick={onPrettify}
                    disabled={isEmpty}
                    title="Format JSON"
                    className={`${buttonBase} ${isEmpty ? buttonDisabled : buttonEnabled}`}
                >
                    <Maximize2 size={14} />
                    <span>Format</span>
                </button>
                <button
                    onClick={onMinify}
                    disabled={isEmpty}
                    title="Minify JSON"
                    className={`${buttonBase} ${isEmpty ? buttonDisabled : buttonEnabled}`}
                >
                    <Minimize2 size={14} />
                    <span>Minify</span>
                </button>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={handleCopy}
                    disabled={isEmpty}
                    title="Copy to clipboard"
                    className={`${buttonBase} ${isEmpty ? buttonDisabled : buttonEnabled} ${copyFeedback ? 'text-green-600 dark:text-green-400' : ''}`}
                >
                    {copyFeedback ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copyFeedback ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                    onClick={onDownload}
                    disabled={isEmpty}
                    title="Download as file"
                    className={`${buttonBase} ${isEmpty ? buttonDisabled : buttonEnabled}`}
                >
                    <Download size={14} />
                </button>
                <div className="w-px h-4 bg-border/50 mx-1" />
                <button
                    onClick={onClear}
                    disabled={isEmpty}
                    title="Clear editor"
                    className={`${buttonBase} ${isEmpty ? buttonDisabled : 'text-destructive/70 hover:text-destructive hover:bg-destructive/10 active:scale-[0.98]'}`}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};
