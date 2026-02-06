import { useState } from 'react';
import Split from 'react-split';
import { Github } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { JsonEditor as Editor } from './features/editor/components/Editor';
import { UniversalViewer } from './features/viewer/components/UniversalViewer';
import { Format } from './types/formats';

function App() {
  const [parsedData, setParsedData] = useState<unknown | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<Format>(Format.TEXT);

  const handleParse = (data: unknown | null, format: Format) => {
    setParsedData(data);
    setDetectedFormat(format);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">

      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 sticky top-0 z-10">
        <div className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
            J
          </div>
          <h1 className="font-semibold tracking-tight text-lg">JLens</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline-block">v1.1.0</span>
          <a href="https://github.com/taoshan98/jlens" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted/50">
            <Github size={18} />
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Split
          className="flex h-[calc(100vh-3.5rem)]"
          sizes={[45, 55]}
          minSize={300}
          gutterSize={4}
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
          <div className="h-full flex flex-col p-2 bg-muted/5 border-l border-border/50">
            <UniversalViewer
              data={parsedData}
              format={detectedFormat}
            />
          </div>
        </Split>
      </main>
    </div>
  );
}

export default App;
