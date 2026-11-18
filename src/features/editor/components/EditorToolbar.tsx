import React from 'react';
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
import { ToolbarButton } from './ToolbarButton';
import { Format, FORMATS } from '../../../types/formats';

export interface ToolbarFormatState {
    currentFormat: Format | undefined;
    detectedFormat: Format;
    convertibleTargets: Format[];
}

export interface ToolbarCapabilities {
    canFormat: boolean;
    canMinify: boolean;
    canUndo: boolean;
    isEmpty: boolean;
    isCopied: boolean;
}

export interface ToolbarActions {
    onPrettify: () => void;
    onMinify: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onOpenFile: () => void;
    onLoadSample: () => void;
    onUndo: () => void;
    onDownload: () => void;
    onClear: () => void;
    onFormatChange: (format: Format | undefined) => void;
    onConvert: (targetFormat: Format) => void;
}

interface EditorToolbarProps {
    formatState: ToolbarFormatState;
    capabilities: ToolbarCapabilities;
    actions: ToolbarActions;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    formatState,
    capabilities,
    actions,
}) => {
    const activeFormat = formatState.currentFormat ?? formatState.detectedFormat;
    const activeFormatName = FORMATS[activeFormat]?.name || 'Text';

    return (
        <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 border-b border-border bg-muted/20">
            <div className="flex flex-wrap items-center gap-1">
                <FormatSelector
                    value={formatState.currentFormat}
                    onChange={actions.onFormatChange}
                    detectedFormat={formatState.detectedFormat}
                />
                <div className="w-px h-4 bg-border mx-0.5" />
                <ToolbarButton
                    onClick={actions.onPrettify}
                    disabled={capabilities.isEmpty || !capabilities.canFormat}
                    title={`Format ${activeFormatName}`}
                    icon={<Maximize2 size={13} />}
                    label="Format"
                />
                <ToolbarButton
                    onClick={actions.onMinify}
                    disabled={capabilities.isEmpty || !capabilities.canMinify}
                    title={`Minify ${activeFormatName}`}
                    icon={<Minimize2 size={13} />}
                    label="Minify"
                />

                {formatState.convertibleTargets.length > 0 && (
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
                                    if (target) actions.onConvert(target);
                                }}
                                className="appearance-none bg-transparent dark:bg-zinc-900 pl-6 pr-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 cursor-pointer rounded-md border border-border/60"
                            >
                                <option value="">Convert...</option>
                                {formatState.convertibleTargets.map((targetId) => (
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
                {capabilities.isEmpty && (
                    <ToolbarButton
                        onClick={actions.onLoadSample}
                        title="Load sample JSON"
                        icon={<Sparkles size={13} />}
                        label="Sample"
                        labelClassName=""
                        tone="accent"
                    />
                )}
                <ToolbarButton
                    onClick={actions.onPaste}
                    title="Paste from clipboard"
                    icon={<ClipboardPaste size={13} />}
                    label="Paste"
                    labelClassName="hidden md:inline"
                />
                <ToolbarButton
                    onClick={actions.onOpenFile}
                    title="Open local file"
                    icon={<FolderOpen size={13} />}
                />
                <ToolbarButton
                    onClick={actions.onUndo}
                    disabled={!capabilities.canUndo}
                    title="Undo last action"
                    icon={<Undo2 size={13} />}
                />
                <ToolbarButton
                    onClick={actions.onCopy}
                    disabled={capabilities.isEmpty}
                    title="Copy to clipboard"
                    icon={capabilities.isCopied ? <Check size={13} /> : <Copy size={13} />}
                    label={capabilities.isCopied ? 'Copied' : 'Copy'}
                    tone={capabilities.isCopied ? 'success' : 'default'}
                />
                <ToolbarButton
                    onClick={actions.onDownload}
                    disabled={capabilities.isEmpty}
                    title={`Download as ${FORMATS[activeFormat]?.extensions[0] || '.txt'}`}
                    ariaLabel="Download as file"
                    icon={<Download size={13} />}
                />
                <div className="w-px h-4 bg-border/50 mx-0.5" />
                <ToolbarButton
                    onClick={actions.onClear}
                    disabled={capabilities.isEmpty}
                    title="Clear editor"
                    icon={<Trash2 size={13} />}
                    tone="danger"
                />
            </div>
        </div>
    );
};
