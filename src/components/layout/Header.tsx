import React from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { Braces, Github } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center sticky top-0 z-10 mb-3">
            <div className="flex items-center gap-2 mr-6 px-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                    <Braces className="w-4 h-4" />
                </div>
                <h1 className="font-semibold tracking-tight text-lg">JLens</h1>
            </div>

            <div className="ml-auto flex items-center gap-2 px-6">
                <span className="text-xs text-muted-foreground hidden sm:inline-block">v1.2.0</span>
                <a href="https://github.com/taoshan98/jlens" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-muted/50">
                    <Github size={18} />
                </a>
                <ThemeToggle />
            </div>
        </header>
    );
};
