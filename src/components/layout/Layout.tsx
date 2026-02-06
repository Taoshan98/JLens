import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
            <Header />
            <main className="flex-1 overflow-hidden px-4">
                {children}
            </main>
            <Footer />
        </div>
    );
};
