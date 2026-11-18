import { useCallback, useEffect, useState } from 'react';
import Split from 'react-split';
import { JsonEditor as Editor } from './features/editor/components/Editor';
import { UniversalViewer } from './features/viewer/components/UniversalViewer';
import { Format } from './types/formats';
import { Layout } from './components/layout/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
    const [parsedData, setParsedData] = useState<unknown | null>(null);
    const [detectedFormat, setDetectedFormat] = useState<Format>(Format.TEXT);
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia('(max-width: 767px)').matches
            : false
    );
    const [mobileTab, setMobileTab] = useState<'editor' | 'viewer'>('editor');

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const media = window.matchMedia('(max-width: 767px)');
        const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    const handleParse = useCallback((data: unknown | null, format: Format) => {
        setParsedData(data);
        setDetectedFormat(format);
    }, []);

    return (
        <Layout>
            <ErrorBoundary fallbackTitle="Workspace error">
                {isMobile ? (
                    <div className="flex flex-col h-full py-2 gap-2">
                        <div
                            role="tablist"
                            aria-label="Mobile workspace view"
                            className="grid grid-cols-2 gap-1 p-1 rounded-lg border border-border bg-muted/20 shrink-0"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={mobileTab === 'editor'}
                                onClick={() => setMobileTab('editor')}
                                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    mobileTab === 'editor'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Editor
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={mobileTab === 'viewer'}
                                onClick={() => setMobileTab('viewer')}
                                className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    mobileTab === 'viewer'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                Viewer
                            </button>
                        </div>

                        <div
                            className={
                                mobileTab === 'editor'
                                    ? 'flex-1 min-h-0 flex flex-col'
                                    : 'hidden'
                            }
                        >
                            <Editor onParse={handleParse} />
                        </div>

                        <div
                            className={
                                mobileTab === 'viewer'
                                    ? 'flex-1 min-h-0 flex flex-col'
                                    : 'hidden'
                            }
                        >
                            <UniversalViewer data={parsedData} format={detectedFormat} />
                        </div>
                    </div>
                ) : (
                    <Split
                        className="flex h-full py-2"
                        sizes={[50, 50]}
                        minSize={240}
                        gutterSize={10}
                        gutterAlign="center"
                        snapOffset={30}
                        dragInterval={1}
                        direction="horizontal"
                        cursor="col-resize"
                    >
                        <div className="h-full min-h-0 flex flex-col pr-1 bg-background/50">
                            <Editor onParse={handleParse} />
                        </div>

                        <div className="h-full min-h-0 flex flex-col pl-1 bg-background/50">
                            <UniversalViewer data={parsedData} format={detectedFormat} />
                        </div>
                    </Split>
                )}
            </ErrorBoundary>
        </Layout>
    );
}

export default App;
