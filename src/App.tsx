import { useState } from 'react';
import Split from 'react-split';
import { JsonEditor as Editor } from './features/editor/components/Editor';
import { UniversalViewer } from './features/viewer/components/UniversalViewer';
import { Format } from './types/formats';
import { Layout } from './components/layout/Layout';

function App() {
    const [parsedData, setParsedData] = useState<unknown | null>(null);
    const [detectedFormat, setDetectedFormat] = useState<Format>(Format.TEXT);

    const handleParse = (data: unknown | null, format: Format) => {
        setParsedData(data);
        setDetectedFormat(format);
    };

    return (
        <Layout>
            <Split
                className="flex h-[calc(100vh-7.5rem)]"
                sizes={[50, 50]}
                gutterSize={8}
                gutterAlign="center"
                snapOffset={30}
                dragInterval={1}
                direction="horizontal"
                cursor="col-resize"
            >
                {/* Left Panel: Editor */}
                <div className="h-full flex flex-col p-2 bg-background/50">
                    <Editor onParse={handleParse} />
                </div>

                {/* Right Panel: Viewer */}
                <div className="h-full flex flex-col p-2 bg-background/50">
                    <UniversalViewer
                        data={parsedData}
                        format={detectedFormat}
                    />
                </div>
            </Split>
        </Layout>
    );
}

export default App;