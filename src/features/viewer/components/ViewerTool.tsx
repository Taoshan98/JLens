import React, { useState, useEffect } from 'react';
import Split from 'react-split';
import jmespath from 'jmespath';
import { Editor } from '../../editor/components/Editor';
import { UniversalViewer } from './UniversalViewer';
import { QueryBar } from './QueryBar';
import { Format } from '../../../types/formats';

export const ViewerTool: React.FC = () => {
    const [parsedData, setParsedData] = useState<unknown | null>(null);
    const [format, setFormat] = useState<Format>(Format.TEXT);
    const [filteredData, setFilteredData] = useState<unknown | null>(null);
    const [query, setQuery] = useState('');
    const [queryError, setQueryError] = useState<string | null>(null);

    // Apply JMESPath query
    useEffect(() => {
        if (!query.trim()) {
            setFilteredData(parsedData);
            setQueryError(null);
            return;
        }

        try {
            const result = jmespath.search(parsedData, query);
            setFilteredData(result);
            setQueryError(null);
        } catch (e: any) {
            setQueryError(e.message);
        }
    }, [parsedData, query]);

    return (
        <div className="flex flex-col h-full gap-2 p-2">
            <QueryBar
                query={query}
                onQueryChange={setQuery}
                error={queryError}
                disabled={!parsedData}
            />

            <Split
                className="flex flex-1 min-h-0"
                sizes={[40, 60]}
                gutterSize={8}
                gutterAlign="center"
                snapOffset={30}
                dragInterval={1}
                direction="horizontal"
                cursor="col-resize"
            >
                <div className="h-full min-w-0">
                    <Editor
                        onParse={(data, fmt) => {
                            setParsedData(data);
                            setFormat(fmt);
                        }}
                    />
                </div>
                <div className="h-full min-w-0 bg-card rounded-lg border border-border p-4 overflow-hidden flex flex-col">
                    <UniversalViewer data={filteredData} format={format} />
                </div>
            </Split>
        </div>
    );
};
