/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare module 'react-syntax-highlighter/dist/esm/prism-light' {
    import type { ComponentType } from 'react';
    import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';

    type PrismLightComponent = ComponentType<SyntaxHighlighterProps> & {
        registerLanguage(name: string, language: unknown): void;
        alias(name: string, aliases: string | string[]): void;
        alias(aliases: Record<string, string | string[]>): void;
    };

    const PrismLight: PrismLightComponent;
    export default PrismLight;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
    import type { CSSProperties } from 'react';
    export const vscDarkPlus: Record<string, CSSProperties>;
    export const oneLight: Record<string, CSSProperties>;
}

declare module 'react-syntax-highlighter/dist/esm/languages/prism/*' {
    const language: Record<string, unknown>;
    export default language;
}
