import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
            <Header />
            <main className="flex-grow container mx-auto px-2 py-3 md:py-4">
                {children}
            </main>
            <Footer />
        </div>
    );
};
