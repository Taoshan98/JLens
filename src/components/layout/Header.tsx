import React from 'react';
import { ThemeToggle } from '../ThemeToggle';
import { Braces } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="border-b border-border/50 bg-background sticky top-0 z-50">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-primary text-primary-foreground rounded-md">
                        <Braces className="w-4 h-4" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">
                            JLens
                        </h1>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                            Paste. Explore. Understand.
                        </span>
                    </div>
                </div>

                <ThemeToggle />
            </div>
        </header>
    );
};
