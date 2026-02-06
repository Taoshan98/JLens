export const Format = {
    JSON: 'json',
    YAML: 'yaml',
    XML: 'xml',
    TOML: 'toml',
    CSV: 'csv',
    INI: 'ini',
    ENV: 'env',
    JSONL: 'jsonl',
    MARKDOWN: 'markdown',
    HTML: 'html',
    SQL: 'sql',
    TEXT: 'text'
} as const;

export type Format = typeof Format[keyof typeof Format];

export const FormatCategory = {
    DATA: 'data',
    DOCUMENT: 'document',
    CODE: 'code'
} as const;

export type FormatCategory = typeof FormatCategory[keyof typeof FormatCategory];

export interface FormatDefinition {
    id: Format;
    name: string;
    category: FormatCategory;
    mimeTypes: string[];
    extensions: string[];
    editorLanguage: string; // for Monaco/Textarea syntax highlighting if we had it, or just for reference
}

export const FORMATS: Record<Format, FormatDefinition> = {
    [Format.JSON]: {
        id: Format.JSON,
        name: 'JSON',
        category: FormatCategory.DATA,
        mimeTypes: ['application/json'],
        extensions: ['.json'],
        editorLanguage: 'json'
    },
    [Format.YAML]: {
        id: Format.YAML,
        name: 'YAML',
        category: FormatCategory.DATA,
        mimeTypes: ['text/yaml', 'application/x-yaml'],
        extensions: ['.yaml', '.yml'],
        editorLanguage: 'yaml'
    },
    [Format.XML]: {
        id: Format.XML,
        name: 'XML',
        category: FormatCategory.DATA,
        mimeTypes: ['application/xml', 'text/xml'],
        extensions: ['.xml'],
        editorLanguage: 'xml'
    },
    [Format.TOML]: {
        id: Format.TOML,
        name: 'TOML',
        category: FormatCategory.DATA,
        mimeTypes: ['application/toml'],
        extensions: ['.toml'],
        editorLanguage: 'toml'
    },
    [Format.CSV]: {
        id: Format.CSV,
        name: 'CSV',
        category: FormatCategory.DATA,
        mimeTypes: ['text/csv'],
        extensions: ['.csv'],
        editorLanguage: 'csv'
    },
    [Format.INI]: {
        id: Format.INI,
        name: 'INI',
        category: FormatCategory.DATA,
        mimeTypes: ['text/ini'],
        extensions: ['.ini'],
        editorLanguage: 'ini'
    },
    [Format.ENV]: {
        id: Format.ENV,
        name: 'Env File',
        category: FormatCategory.DATA, // Treated as data (key-value)
        mimeTypes: ['text/plain'],
        extensions: ['.env'],
        editorLanguage: 'shell'
    },
    [Format.JSONL]: {
        id: Format.JSONL,
        name: 'JSON Lines',
        category: FormatCategory.DATA,
        mimeTypes: ['application/x-ndjson'],
        extensions: ['.jsonl', '.ndjson'],
        editorLanguage: 'json'
    },
    [Format.MARKDOWN]: {
        id: Format.MARKDOWN,
        name: 'Markdown',
        category: FormatCategory.DOCUMENT,
        mimeTypes: ['text/markdown'],
        extensions: ['.md', '.markdown'],
        editorLanguage: 'markdown'
    },
    [Format.HTML]: {
        id: Format.HTML,
        name: 'HTML',
        category: FormatCategory.DOCUMENT,
        mimeTypes: ['text/html'],
        extensions: ['.html', '.htm'],
        editorLanguage: 'html'
    },
    [Format.SQL]: {
        id: Format.SQL,
        name: 'SQL',
        category: FormatCategory.CODE, // Or DATA if we decide to parse it? For now CODE.
        mimeTypes: ['application/sql'],
        extensions: ['.sql'],
        editorLanguage: 'sql'
    },
    [Format.TEXT]: {
        id: Format.TEXT,
        name: 'Plain Text',
        category: FormatCategory.CODE,
        mimeTypes: ['text/plain'],
        extensions: ['.txt'],
        editorLanguage: 'text'
    }
};
