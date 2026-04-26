import { ThemeToggle } from '../ThemeToggle';
import {
    Braces,
    Github,
    FileJson,
    GitCompare,
    Code2,
    ShieldCheck,
    ArrowRightLeft
} from 'lucide-react';
import type { ToolId } from '../../types';

interface HeaderProps {
    activeTool: ToolId;
    onSelect: (tool: ToolId) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTool, onSelect }) => {
    const tools = [
        { id: 'viewer', label: 'Viewer', icon: FileJson },
        { id: 'diff', label: 'Diff', icon: GitCompare },
        { id: 'codegen', label: 'Type Gen', icon: Code2 },
        { id: 'jwt', label: 'JWT', icon: ShieldCheck },
        { id: 'converter', label: 'Converter', icon: ArrowRightLeft },
    ] as const;

    return (
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center sticky top-0 z-10 mb-3 justify-between">
            <div className="flex items-center gap-2 px-6 w-[200px]">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                    <Braces className="w-4 h-4" />
                </div>
                <h1 className="font-semibold tracking-tight text-lg">JLens</h1>
            </div>

            <nav className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => onSelect(tool.id)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                                ${isActive
                                    ? 'bg-background text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                                }
                            `}
                            title={tool.label}
                        >
                            <Icon size={16} />
                            <span className="hidden md:inline">{tool.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="flex items-center gap-2 px-6 justify-end w-[200px]">
                <span className="text-xs text-muted-foreground hidden sm:inline-block">{__APP_VERSION__}</span>
                <a href="https://github.com/taoshan98/jlens" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted/50">
                    <Github size={18} />
                </a>
                <ThemeToggle />
            </div>
        </header>
    );
};
