import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="h-dvh bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 overflow-hidden">
            <Header />
            <main className="flex-1 min-h-0 overflow-hidden px-3 sm:px-4">
                {children}
            </main>
            <Footer />
        </div>
    );
};
