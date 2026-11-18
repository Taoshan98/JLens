import React, { Suspense, useCallback, useState } from 'react';
import { Braces, FileText, Code2, Network, Table2, FileCode2 } from 'lucide-react';
import { JsonTree } from './JsonTree';
import { NodeDetailPanel, type NodeDetail } from './NodeDetailPanel';
import { DataTableView } from './DataTableView';
import { Format, FORMATS, FormatCategory } from '../../../types/formats';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { ResizableSplit } from '../../../components/ResizableSplit';

const DocumentPreview = React.lazy(() =>
    import('./DocumentPreview').then((mod) => ({ default: mod.DocumentPreview }))
);

const SchemaView = React.lazy(() =>
    import('./SchemaView').then((mod) => ({ default: mod.SchemaView }))
);

interface UniversalViewerProps {
    data: unknown;
    format: Format;
}

type DataViewMode = 'tree' | 'table' | 'schema';

export const UniversalViewer: React.FC<UniversalViewerProps> = ({ data, format }) => {
    const [selectionState, setSelectionState] = useState<{
        dataRef: unknown;
        node: NodeDetail | null;
    }>({
        dataRef: null,
        node: null,
    });
    const [viewMode, setViewMode] = useState<DataViewMode>('tree');

    const formatDef = FORMATS[format];
    const category = formatDef?.category || FormatCategory.DATA;

    const selectedNode = selectionState.dataRef === data ? selectionState.node : null;

    const handleSelect = useCallback(
        (path: string, value: unknown, key: string) => {
            let type: string = typeof value;
            if (value === null) type = 'null';
            else if (Array.isArray(value)) type = 'array';

            setSelectionState({
                dataRef: data,
                node: {
                    key,
                    value,
                    type,
                    path,
                },
            });
        },
        [data]
    );

    if (data === null || data === undefined) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground border border-dashed border-border/60 rounded-lg bg-muted/20">
                <div className="p-3 rounded-lg bg-muted/50 mb-3">
                    {category === FormatCategory.DOCUMENT ? (
                        <FileText size={24} className="text-muted-foreground/50" />
                    ) : category === FormatCategory.CODE ? (
                        <Code2 size={24} className="text-muted-foreground/50" />
                    ) : (
                        <Braces size={24} className="text-muted-foreground/50" />
                    )}
                </div>
                <p className="text-sm font-medium text-muted-foreground/70">No content to display</p>
                <p className="text-xs text-muted-foreground/50 mt-1">
                    Paste, drop a file, or load a sample in the editor
                </p>
            </div>
        );
    }

    if (category === FormatCategory.DOCUMENT || format === Format.SQL) {
        return (
            <ErrorBoundary fallbackTitle="Preview error">
                <div className="h-full overflow-hidden rounded-lg border border-border bg-card">
                    <Suspense
                        fallback={
                            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                                Loading preview...
                            </div>
                        }
                    >
                        <DocumentPreview content={String(data)} format={format} />
                    </Suspense>
                </div>
            </ErrorBoundary>
        );
    }

    if (typeof data === 'string') {
        return (
            <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap text-foreground/80">
                    {data}
                </pre>
            </div>
        );
    }

    const isStructuredObject = typeof data === 'object' && data !== null;

    if (!isStructuredObject) {
        return (
            <div className="h-full overflow-hidden">
                <JsonTree
                    data={data}
                    selectedPath={selectedNode?.path}
                    onSelect={handleSelect}
                />
            </div>
        );
    }

    return (
        <ErrorBoundary fallbackTitle="Viewer error">
            <div className="h-full overflow-hidden flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 shrink-0">
                    <div
                        role="tablist"
                        aria-label="Viewer mode"
                        className="inline-flex items-center gap-1 p-0.5 rounded-md border border-border bg-muted/20"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === 'tree'}
                            onClick={() => setViewMode('tree')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                viewMode === 'tree'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Network size={13} />
                            <span>Tree</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === 'table'}
                            onClick={() => setViewMode('table')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                viewMode === 'table'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Table2 size={13} />
                            <span>Table</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === 'schema'}
                            onClick={() => setViewMode('schema')}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                                viewMode === 'schema'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <FileCode2 size={13} />
                            <span>Types / Schema</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                    {viewMode === 'tree' && (
                        <ResizableSplit
                            direction="vertical"
                            initialRatio={0.7}
                            minFirstPx={120}
                            minSecondPx={96}
                            gutterSize={12}
                            ariaLabel="Resize tree and node details"
                            className="h-full"
                            first={
                                <div className="h-full overflow-hidden">
                                    <JsonTree
                                        data={data}
                                        selectedPath={selectedNode?.path}
                                        onSelect={handleSelect}
                                    />
                                </div>
                            }
                            second={
                                <div className="h-full overflow-auto rounded-lg border border-border bg-card">
                                    <NodeDetailPanel selectedNode={selectedNode} rootData={data} />
                                </div>
                            }
                        />
                    )}

                    {viewMode === 'table' && <DataTableView data={data} />}

                    {viewMode === 'schema' && (
                        <Suspense
                            fallback={
                                <div className="h-full flex items-center justify-center rounded-lg border border-border bg-card text-xs text-muted-foreground">
                                    Loading schema generator...
                                </div>
                            }
                        >
                            <SchemaView data={data} />
                        </Suspense>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};
