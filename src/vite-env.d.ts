/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
    import type { CSSProperties } from 'react';
    export const vscDarkPlus: Record<string, CSSProperties>;
    export const oneLight: Record<string, CSSProperties>;
}

declare module 'react-syntax-highlighter/dist/esm/languages/prism/*' {
    const language: Record<string, unknown>;
    export default language;
}
