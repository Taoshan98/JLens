import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { JsonEditor } from './features/editor/components/JsonEditor';
import { JsonTree } from './features/viewer/components/JsonTree';
import { PenLine, Eye } from 'lucide-react';

function App() {
  const [parsedData, setParsedData] = useState<unknown | null>(null);

  return (
    <Layout>
      <div className="h-[calc(100vh-9rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
          {/* Left Panel: Input Editor */}
          <section className="h-full flex flex-col min-h-0">
            <header className="flex items-center gap-2 mb-3">
              <PenLine className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Editor</h2>
            </header>
            <div className="flex-1 min-h-0">
              <JsonEditor onParse={setParsedData} />
            </div>
          </section>

          {/* Right Panel: Viewer */}
          <section className="hidden lg:flex flex-col h-full min-h-0">
            <header className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Viewer</h2>
            </header>
            <div className="flex-1 min-h-0">
              <JsonTree data={parsedData} />
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default App;
