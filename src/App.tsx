import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import type { ToolId } from './types';

import { ViewerTool } from './features/viewer/components/ViewerTool';
import { DiffTool } from './features/diff/components/DiffTool';
import { CodeGenTool } from './features/codegen/components/CodeGenTool';
import { JwtTool } from './features/jwt/components/JwtTool';
import { ConverterTool } from './features/converter/components/ConverterTool';

function App() {
    const [activeTool, setActiveTool] = useState<ToolId>('viewer');

    const renderTool = () => {
        switch (activeTool) {
            case 'viewer':
                return <ViewerTool />;
            case 'diff':
                return <DiffTool />;
            case 'codegen':
                return <CodeGenTool />;
            case 'jwt':
                return <JwtTool />;
            case 'converter':
                return <ConverterTool />;
            default:
                return <ViewerTool />;
        }
    };

    return (
        <Layout activeTool={activeTool} onSelect={(tool) => setActiveTool(tool)}>
            <div className="flex h-[calc(100vh-7.5rem)]">
                <div className="flex-1 overflow-hidden">
                    {renderTool()}
                </div>
            </div>
        </Layout>
    );
}

export default App;