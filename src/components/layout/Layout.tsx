import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

import type { ToolId } from '../../types';

interface LayoutProps {
    children: React.ReactNode;
    activeTool: ToolId;
    onSelect: (tool: ToolId) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTool, onSelect }) => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
            <Header activeTool={activeTool} onSelect={onSelect} />
            <main className="flex-1 overflow-hidden ps-1 pe-4">
                {children}
            </main>
            <Footer />
        </div>
    );
};
