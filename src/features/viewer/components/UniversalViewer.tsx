import React from 'react';
import { JsonTree } from './JsonTree';
import { NodeDetailPanel, type NodeDetail } from './NodeDetailPanel';
import Split from 'react-split';
import { DocumentPreview } from './DocumentPreview';
import { Format, FORMATS, FormatCategory } from '../../../types/formats';
import { Braces, FileText, Code2 } from 'lucide-react';

interface UniversalViewerProps {
    data: unknown;
    format: Format;
}

export const UniversalViewer: React.FC<UniversalViewerProps> = ({ data, format }) => {
    const formatDef = FORMATS[format];
    const category = formatDef?.category || FormatCategory.DATA;

    if (data === null || data === undefined) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground border border-dashed border-border/60 rounded-lg bg-muted/20">
                <div className="p-3 rounded-lg bg-muted/50 mb-3">
                    {category === FormatCategory.DOCUMENT ? <FileText size={24} className="text-muted-foreground/50" /> :
                        category === FormatCategory.CODE ? <Code2 size={24} className="text-muted-foreground/50" /> :
                            <Braces size={24} className="text-muted-foreground/50" />}
                </div>
                <p className="text-sm font-medium text-muted-foreground/70">No content to display</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Paste content in the editor</p>
            </div>
        );
    }

    if (category === FormatCategory.DOCUMENT) {
        return (
            <div className="h-full overflow-hidden rounded-lg border border-border bg-card">
                <DocumentPreview content={data as string} format={format} />
            </div>
        );
    }

    // For DATA and CODE (if we parsed logic for code, usually object or fallback to string)
    // If data is string and not DOCUMENT, maybe show as raw text?
    // But FormatManager parses ENV to object. SQL to string.

    // Fallback for string data that is not document (like SQL, or just plain text)
    if (typeof data === 'string') {
        return (
            <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap text-foreground/80">{data}</pre>
            </div>
        );
    }

    // State for selection
    const [selectedNode, setSelectedNode] = React.useState<NodeDetail | null>(null);

    // Update selection when data changes (reset?)
    React.useEffect(() => {
        setSelectedNode(null);
    }, [data]);

    const handleSelect = (path: string, value: unknown, key: string) => {
        let type: string = typeof value;
        if (value === null) type = 'null';
        else if (Array.isArray(value)) type = 'array';

        setSelectedNode({
            key,
            value,
            type,
            path
        });
    };

    return (
        <div className="h-full overflow-hidden flex flex-col">
            <Split
                className="flex flex-col h-full"
                sizes={[70, 30]}
                minSize={100}
                gutterSize={16}
                gutterAlign="center"
                snapOffset={30}
                dragInterval={1}
                direction="vertical"
                cursor="row-resize"
            >
                <div className="h-full overflow-hidden">
                    <JsonTree
                        data={data}
                        selectedPath={selectedNode?.path}
                        onSelect={handleSelect}
                    />
                </div>

                <div className="h-full overflow-auto rounded-lg border border-border bg-card">
                    <NodeDetailPanel selectedNode={selectedNode} />
                </div>
            </Split>
        </div>
    );
};
