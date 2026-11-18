import { parse as parseYaml, stringify as stringifyYaml, parseDocument } from 'yaml';
import * as toml from 'smol-toml';
import Papa from 'papaparse';
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
import * as ini from 'ini';
import { format as formatSql } from 'sql-formatter';
import { html_beautify } from 'js-beautify';
import { Format, FormatCategory, FORMATS } from '../types/formats';

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatEnvValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (str === '' || /[\s#"'=`\r\n]/.test(str)) {
        return JSON.stringify(str);
    }
    return str;
}

function sanitizeForToml(value: unknown): unknown {
    if (value === null || value === undefined) return undefined;
    if (Array.isArray(value)) {
        return value
            .map((item) => sanitizeForToml(item))
            .filter((item) => item !== undefined);
    }
    if (isPlainObject(value)) {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            const sanitized = sanitizeForToml(v);
            if (sanitized !== undefined) {
                result[k] = sanitized;
            }
        }
        return result;
    }
    return value;
}

function flattenForCsvRow(value: unknown): Record<string, unknown> {
    if (!isPlainObject(value)) {
        return { value: value === undefined ? '' : value };
    }
    const row: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
        if (v === null || v === undefined) {
            row[k] = '';
        } else if (typeof v === 'object') {
            row[k] = JSON.stringify(v);
        } else {
            row[k] = v;
        }
    }
    return row;
}

function flattenToEnvEntries(
    value: unknown,
    prefix: string,
    out: Array<[string, unknown]>
): void {
    if (isPlainObject(value)) {
        for (const [k, v] of Object.entries(value)) {
            const normalizedKey = k
                .replace(/[^A-Za-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')
                .toUpperCase() || 'KEY';
            const nextKey = prefix ? `${prefix}_${normalizedKey}` : normalizedKey;
            flattenToEnvEntries(v, nextKey, out);
        }
        return;
    }

    const finalKey = prefix || 'VALUE';
    out.push([finalKey, value]);
}

export class FormatManager {
    private static xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    });

    private static xmlBuilder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
    });

    static detect(content: string): Format {
        const trimmed = content.trim();
        if (!trimmed) return Format.TEXT;

        // 1. JSON
        if (
            (trimmed.startsWith('{') || trimmed.startsWith('[')) &&
            (trimmed.endsWith('}') || trimmed.endsWith(']'))
        ) {
            try {
                JSON.parse(trimmed);
                return Format.JSON;
            } catch {
                /* fall through to JSONL or other detectors */
            }
        }

        const nonEmptyLines = trimmed
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        // 2. JSONL (NDJSON)
        if (nonEmptyLines.length >= 2) {
            const looksJsonLines = nonEmptyLines.every(
                (line) =>
                    (line.startsWith('{') && line.endsWith('}')) ||
                    (line.startsWith('[') && line.endsWith(']'))
            );
            if (looksJsonLines) {
                let parsedCount = 0;
                for (const line of nonEmptyLines) {
                    try {
                        JSON.parse(line);
                        parsedCount++;
                    } catch {
                        /* individual invalid line still triggers JSONL validation error */
                    }
                }
                if (parsedCount === nonEmptyLines.length || parsedCount >= 1) {
                    return Format.JSONL;
                }
            }
        }

        // 3. HTML / XML
        if (trimmed.startsWith('<')) {
            if (
                /^(?:<!DOCTYPE\s+html|<html[\s>]|<(?:head|body|div|section|article|main|header|footer|nav|p|h[1-6]|ul|ol|table|form|script|style)[\s>])/i.test(
                    trimmed
                )
            ) {
                return Format.HTML;
            }
            if (XMLValidator.validate(trimmed) === true) {
                return Format.XML;
            }
            if (
                /^<\?xml\b|^<[A-Za-z_][\w.:-]*(?:\s[^<>]*?)?>[\s\S]*(?:<\/[A-Za-z_][\w.:-]*>|<[A-Za-z_][\w.:-]*>)/m.test(
                    trimmed
                )
            ) {
                return Format.XML;
            }
        }

        // 4. Markdown with YAML Frontmatter
        if (/^---\r?\n[\s\S]+?\r?\n---\r?\n[\s\S]+/.test(trimmed)) {
            return Format.MARKDOWN;
        }

        // 5. ENV (checked before TOML/INI for uppercase/export/unquoted KEY=VAL files)
        const hasIniSection = /^\[[^\]]+\]\s*$/m.test(trimmed);
        const hasIniSemicolonComment = /^\s*;/m.test(trimmed);
        if (!hasIniSection && !hasIniSemicolonComment && nonEmptyLines.length > 0) {
            const envLinePattern = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/;
            const allEnvCompatible = nonEmptyLines.every(
                (line) => line.startsWith('#') || envLinePattern.test(line)
            );
            const entryKeys = nonEmptyLines
                .filter((line) => !line.startsWith('#'))
                .map((line) => line.match(envLinePattern)?.[1] || '');

            if (allEnvCompatible && entryKeys.length > 0) {
                const hasExport = nonEmptyLines.some((line) => /^export\s+/.test(line));
                const allUpperKeys = entryKeys.every((key) => /^[A-Z][A-Z0-9_]*$/.test(key));
                let tomlValid = false;
                try {
                    const parsedToml = toml.parse(trimmed);
                    tomlValid = isPlainObject(parsedToml) && Object.keys(parsedToml).length > 0;
                } catch {
                    tomlValid = false;
                }
                if (hasExport || allUpperKeys || !tomlValid) {
                    return Format.ENV;
                }
            }
        }

        // 6. TOML
        try {
            const res = toml.parse(trimmed);
            if (isPlainObject(res) && Object.keys(res).length > 0) {
                return Format.TOML;
            }
        } catch {
            /* not valid TOML */
        }

        // 7. CSV (comma, semicolon, or tab delimited tabular text)
        if (nonEmptyLines.length >= 2 && !nonEmptyLines[0].startsWith('|')) {
            const candidateDelimiters = [',', ';', '\t'] as const;
            for (const delimiter of candidateDelimiters) {
                if (!nonEmptyLines[0].includes(delimiter)) continue;
                const parsedCsv = Papa.parse<string[]>(trimmed, {
                    delimiter,
                    skipEmptyLines: true,
                });
                const rows = parsedCsv.data;
                if (
                    parsedCsv.errors.length === 0 &&
                    rows.length >= 2 &&
                    rows[0].length >= 2 &&
                    rows.every((row) => row.length === rows[0].length)
                ) {
                    const headerClean = rows[0].every((cell) => {
                        const val = cell.trim();
                        return val.length > 0 && val.length <= 60 && !/[!?]$/.test(val);
                    });
                    if (rows.length >= 3 || headerClean) {
                        return Format.CSV;
                    }
                }
            }
        }

        // 8. Markdown vs YAML disambiguation
        const hasYamlMappingKey = /^(?:-\s+)?(?:"[^"]+"|'[^']+'|[\w.-]+)\s*:(?:\s|$)/m.test(
            trimmed
        );
        const hasStrongMarkdownSignals =
            (/^#{1,6}\s+.+/m.test(trimmed) &&
                (/^#{2,6}\s+/m.test(trimmed) ||
                    /```[\s\S]*?```/.test(trimmed) ||
                    /\[.+?\]\(.+?\)/.test(trimmed) ||
                    /\*\*[^*\n]+?\*\*/.test(trimmed) ||
                    /^>\s/m.test(trimmed) ||
                    (!hasYamlMappingKey && /^(?:[-*+]|\d+\.)\s+/m.test(trimmed)))) ||
            /^\|.+\|\r?\n\|[-:| ]+\|/m.test(trimmed);

        if (!hasStrongMarkdownSignals) {
            try {
                const res = parseYaml(trimmed);
                if (typeof res === 'object' && res !== null) {
                    return Format.YAML;
                }
            } catch {
                /* fall through to pseudo-YAML heuristic */
            }

            const yamlHeuristic = /^[\w-]+\s*:\s*(?:$|[^\s])/m;
            if (yamlHeuristic.test(trimmed) && trimmed.includes('\n')) {
                const colonCount = (trimmed.match(/:/g) || []).length;
                const hasIndentation = /^\s{2,}/m.test(trimmed);
                if (colonCount >= 2 || hasIndentation) {
                    return Format.YAML;
                }
            }
        }

        // 9. SQL (strict statement prefix after optional comments, checked before INI)
        const sqlStatementPattern =
            /^\s*(?:(?:--[^\r\n]*|\/\*[\s\S]*?\*\/)\s*)*(?:SELECT\b[\s\S]+?\bFROM\b|SELECT\s+(?:[\d'"(@]|NOW\(|CURRENT_|VERSION\()|INSERT\s+INTO\s+\S+|UPDATE\s+\S+\s+SET\s+|DELETE\s+FROM\s+\S+|CREATE\s+(?:OR\s+REPLACE\s+)?(?:TEMP(?:ORARY)?\s+)?(?:TABLE|VIEW|INDEX|DATABASE|SCHEMA|FUNCTION|TRIGGER|PROCEDURE|TYPE)\b|ALTER\s+(?:TABLE|VIEW|DATABASE|SCHEMA|TYPE)\b|DROP\s+(?:TABLE|VIEW|INDEX|DATABASE|SCHEMA|FUNCTION|TRIGGER)\b|WITH\s+[A-Za-z_][\w]*\s+AS\s*\()/im;
        if (sqlStatementPattern.test(trimmed)) {
            return Format.SQL;
        }

        // 10. INI
        if (
            trimmed.includes('=') &&
            !trimmed.includes('{') &&
            nonEmptyLines.every(
                (line) =>
                    line.startsWith(';') ||
                    line.startsWith('#') ||
                    /^\[[^\]]+\]$/.test(line) ||
                    /^[A-Za-z0-9_.-]+\s*=/.test(line)
            )
        ) {
            try {
                const res = ini.parse(trimmed);
                if (Object.keys(res).length > 0) return Format.INI;
            } catch {
                /* not INI */
            }
        }

        // 11. Markdown
        const mdPatterns = [
            /^#{1,6}\s/m,
            /^[-*+]\s/m,
            /^\d+\.\s/m,
            /^>\s/m,
            /```[\s\S]*?```/,
            /\[.+?\]\(.+?\)/,
            /\*\*.+?\*\*/,
            /_{2}.+?_{2}/,
            /`[^`\n]+?`/,
            /^\|.+\|\r?\n\|[-:| ]+\|/m,
        ];

        const matchCount = mdPatterns.reduce(
            (acc, pattern) => acc + (pattern.test(trimmed) ? 1 : 0),
            0
        );

        if (matchCount >= 1) {
            const hasBlock = [
                /^#{1,6}\s/m,
                /^[-*+]\s/m,
                /^\d+\.\s/m,
                /^>\s/m,
                /```[\s\S]*?```/,
                /^\|.+\|\r?\n\|[-:| ]+\|/m,
            ].some((p) => p.test(trimmed));
            if (hasBlock || matchCount >= 2) {
                return Format.MARKDOWN;
            }
        }

        return Format.TEXT;
    }

    static parse(content: string, format: Format): unknown {
        if (!content.trim()) return null;

        switch (format) {
            case Format.JSON:
                return JSON.parse(content);
            case Format.YAML:
                return parseYaml(content);
            case Format.TOML:
                return toml.parse(content);
            case Format.XML: {
                const validation = XMLValidator.validate(content);
                if (validation !== true) {
                    throw new Error(
                        `XML Error (line ${validation.err.line}, col ${validation.err.col}): ${validation.err.msg}`
                    );
                }
                return FormatManager.xmlParser.parse(content);
            }
            case Format.CSV: {
                const parsed = Papa.parse<Record<string, unknown>>(content, {
                    header: true,
                    skipEmptyLines: true,
                    dynamicTyping: true,
                });
                if (parsed.errors.length > 0 && parsed.data.length === 0) {
                    throw new Error(parsed.errors[0].message);
                }
                return parsed.data;
            }
            case Format.INI:
                return ini.parse(content);
            case Format.ENV: {
                const result: Record<string, string> = {};
                const lines = content.split(/\r?\n/);

                for (let i = 0; i < lines.length; i++) {
                    const trimmed = lines[i].trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;

                    const normalized = trimmed.replace(/^export\s+/, '');
                    const eqIndex = normalized.indexOf('=');
                    if (eqIndex === -1) {
                        throw new Error(`Invalid ENV entry at line ${i + 1}: missing '='`);
                    }

                    const key = normalized.slice(0, eqIndex).trim();
                    if (!key) {
                        throw new Error(`Invalid ENV entry at line ${i + 1}: empty key`);
                    }

                    let value = normalized.slice(eqIndex + 1).trim();
                    if (
                        (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
                        (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
                    ) {
                        const quote = value[0];
                        value = value.slice(1, -1);
                        if (quote === '"') {
                            value = value.replace(/\\n/g, '\n').replace(/\\"/g, '"');
                        }
                    } else {
                        value = value.replace(/\s+#.*$/, '').trim();
                    }

                    result[key] = value;
                }
                return result;
            }
            case Format.JSONL: {
                const lines = content.split(/\r?\n/);
                const items: unknown[] = [];

                for (let i = 0; i < lines.length; i++) {
                    const trimmed = lines[i].trim();
                    if (!trimmed) continue;
                    try {
                        items.push(JSON.parse(trimmed));
                    } catch (err) {
                        const message = err instanceof Error ? err.message : 'Invalid JSON';
                        throw new Error(`Invalid JSON at line ${i + 1}: ${message}`);
                    }
                }
                return items;
            }
            default:
                return content;
        }
    }

    static stringify(data: unknown, format: Format): string {
        if (data === undefined) return '';
        if (data === null && format !== Format.JSON) return '';

        switch (format) {
            case Format.JSON:
                if (typeof data === 'string') {
                    try {
                        return JSON.stringify(JSON.parse(data), null, 2);
                    } catch {
                        return data;
                    }
                }
                return JSON.stringify(data, null, 2);
            case Format.YAML:
                if (typeof data === 'string') {
                    try {
                        const parsed = parseYaml(data);
                        return stringifyYaml(parsed);
                    } catch {
                        const repaired = FormatManager.repairIndent(data);
                        try {
                            const parsedRepaired = parseYaml(repaired);
                            return stringifyYaml(parsedRepaired);
                        } catch {
                            const doc = parseDocument(data);
                            return doc.errors.length === 0 ? doc.toString() : data;
                        }
                    }
                }
                return stringifyYaml(data);
            case Format.TOML: {
                if (typeof data === 'string') return data;
                const sanitized = sanitizeForToml(data);
                const table = isPlainObject(sanitized) ? sanitized : { items: sanitized };
                return toml.stringify(table);
            }
            case Format.XML: {
                if (typeof data === 'string') return data;
                return FormatManager.xmlBuilder.build(data);
            }
            case Format.CSV: {
                if (typeof data === 'string') return data;
                const rows = Array.isArray(data)
                    ? data.map((row) => flattenForCsvRow(row))
                    : [flattenForCsvRow(data)];
                return Papa.unparse<Record<string, unknown>>(rows);
            }
            case Format.INI:
                return typeof data === 'string' ? data : ini.stringify(data);
            case Format.ENV: {
                if (typeof data === 'string') {
                    return data
                        .split(/\r?\n/)
                        .map((line) => {
                            const trimmed = line.trim();
                            if (!trimmed || trimmed.startsWith('#')) return trimmed;
                            const eqIndex = trimmed.indexOf('=');
                            if (eqIndex === -1) return line;
                            const keyPart = trimmed.slice(0, eqIndex).trim();
                            const valPart = trimmed.slice(eqIndex + 1).trim();
                            return `${keyPart}=${valPart}`;
                        })
                        .join('\n');
                }
                if (isPlainObject(data)) {
                    return Object.entries(data)
                        .map(([k, v]) => `${k}=${formatEnvValue(v)}`)
                        .join('\n');
                }
                return '';
            }
            case Format.JSONL: {
                if (Array.isArray(data)) {
                    return data.map((item) => JSON.stringify(item)).join('\n');
                }
                if (typeof data === 'string') {
                    return data
                        .split(/\r?\n/)
                        .filter((line) => line.trim() !== '')
                        .map((line) => {
                            try {
                                return JSON.stringify(JSON.parse(line));
                            } catch {
                                return line.trim();
                            }
                        })
                        .join('\n');
                }
                return JSON.stringify(data);
            }
            case Format.SQL:
                return typeof data === 'string' ? formatSql(data) : '';
            case Format.HTML:
                return typeof data === 'string'
                    ? html_beautify(data, {
                          indent_size: 2,
                          wrap_line_length: 80,
                      })
                    : '';
            default:
                if (typeof data === 'string') return data;
                return JSON.stringify(data, null, 2);
        }
    }

    static canFormat(format: Format): boolean {
        return format !== Format.TEXT && format !== Format.MARKDOWN;
    }

    static canMinify(format: Format): boolean {
        return (
            format === Format.JSON ||
            format === Format.JSONL ||
            format === Format.XML ||
            format === Format.HTML ||
            format === Format.SQL ||
            format === Format.ENV
        );
    }

    static getConvertibleTargets(sourceFormat: Format, data: unknown): Format[] {
        if (data === null || typeof data !== 'object') return [];
        const dataFormats = Object.values(FORMATS)
            .filter((def) => def.category === FormatCategory.DATA && def.id !== sourceFormat)
            .map((def) => def.id);
        return dataFormats;
    }

    static convert(data: unknown, targetFormat: Format): string {
        if (data === null || data === undefined) return '';

        switch (targetFormat) {
            case Format.JSON:
                return JSON.stringify(data, null, 2);
            case Format.YAML:
                return stringifyYaml(data);
            case Format.TOML: {
                const sanitized = sanitizeForToml(data);
                const table = isPlainObject(sanitized) ? sanitized : { items: sanitized };
                return toml.stringify(table);
            }
            case Format.XML: {
                if (Array.isArray(data)) {
                    return FormatManager.xmlBuilder.build({ root: { item: data } });
                }
                if (isPlainObject(data)) {
                    const keys = Object.keys(data);
                    const wrapped = keys.length === 1 ? data : { root: data };
                    return FormatManager.xmlBuilder.build(wrapped);
                }
                return FormatManager.xmlBuilder.build({ root: data });
            }
            case Format.CSV: {
                const rows = Array.isArray(data)
                    ? data.map((row) => flattenForCsvRow(row))
                    : [flattenForCsvRow(data)];
                return Papa.unparse<Record<string, unknown>>(rows);
            }
            case Format.INI: {
                const target = Array.isArray(data) ? { items: data } : data;
                return ini.stringify(target);
            }
            case Format.ENV: {
                const entries: Array<[string, unknown]> = [];
                if (Array.isArray(data)) {
                    data.forEach((item, idx) => {
                        flattenToEnvEntries(item, `ITEM_${idx}`, entries);
                    });
                } else {
                    flattenToEnvEntries(data, '', entries);
                }
                return entries.map(([k, v]) => `${k}=${formatEnvValue(v)}`).join('\n');
            }
            case Format.JSONL:
                if (Array.isArray(data)) {
                    return data.map((item) => JSON.stringify(item)).join('\n');
                }
                return JSON.stringify(data);
            default:
                return FormatManager.stringify(data, targetFormat);
        }
    }

    private static repairIndent(content: string): string {
        const lines = content.split(/\r?\n/);
        const result: string[] = [];

        let lastScalarIndent = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('#')) {
                result.push(line);
                continue;
            }

            const match = line.match(/^(\s*)(.*)$/);
            const currentIndent = match ? match[1].length : 0;
            const contentPart = match ? match[2] : '';

            const isKeyPair = /^(".*?"|'.*?'|[\w-]+):(?:\s|$)/.test(contentPart);

            if (lastScalarIndent !== -1 && currentIndent > lastScalarIndent && isKeyPair) {
                const dedented = ' '.repeat(lastScalarIndent) + contentPart;
                result.push(dedented);

                const isScalar = /^(".*?"|'.*?'|[\w-]+):\s+(?![|>]).+$/.test(contentPart);
                if (!isScalar) {
                    lastScalarIndent = -1;
                }
            } else {
                result.push(line);
                const isScalar = /^(".*?"|'.*?'|[\w-]+):\s+(?![|>]).+$/.test(contentPart);

                if (isScalar) {
                    lastScalarIndent = currentIndent;
                } else if (currentIndent <= lastScalarIndent) {
                    lastScalarIndent = -1;
                }
            }
        }
        return result.join('\n');
    }

    static getLanguage(format: Format): string {
        return FORMATS[format].editorLanguage || 'text';
    }

    static minify(content: string, format: Format): string {
        if (!content.trim()) return '';

        switch (format) {
            case Format.JSON:
                try {
                    return JSON.stringify(JSON.parse(content));
                } catch {
                    return content;
                }
            case Format.JSONL:
                return content
                    .split(/\r?\n/)
                    .filter((line) => line.trim() !== '')
                    .map((line) => {
                        try {
                            return JSON.stringify(JSON.parse(line));
                        } catch {
                            return line.trim();
                        }
                    })
                    .join('\n');
            case Format.SQL: {
                const tokenRegex =
                    /('(?:''|[^'])*'|"(?:""|[^"])*"|`[^`]*`)|(?:--[^\r\n]*|\/\*[\s\S]*?\*\/|\s)+/g;
                return content
                    .replace(tokenRegex, (_match, literal: string | undefined) => {
                        if (literal !== undefined) return literal;
                        return ' ';
                    })
                    .replace(/\s+([,;()])/g, '$1')
                    .replace(/\(\s+/g, '(')
                    .trim();
            }
            case Format.XML:
                return content.replace(/>\s+</g, '><').trim();
            case Format.HTML: {
                const preservedBlocks: string[] = [];
                let sentinelPrefix = '__JLENS_HTML_BLOCK_';
                while (content.includes(sentinelPrefix)) {
                    sentinelPrefix += '_';
                }

                const protectedHtml = content.replace(
                    /<(pre|code|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
                    (block) => {
                        const token = `${sentinelPrefix}${preservedBlocks.length}__`;
                        preservedBlocks.push(block);
                        return token;
                    }
                );

                const compacted = protectedHtml
                    .replace(/<!--[\s\S]*?-->/g, '')
                    .replace(/>\s+</g, '><')
                    .replace(/\s+/g, ' ')
                    .trim();

                const restoreRegex = new RegExp(`${sentinelPrefix}(\\d+)__`, 'g');
                return compacted.replace(restoreRegex, (_m, idx: string) => {
                    return preservedBlocks[Number(idx)] ?? '';
                });
            }
            case Format.ENV:
                return content
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter((line) => line !== '' && !line.startsWith('#'))
                    .map((line) => {
                        const eqIdx = line.indexOf('=');
                        if (eqIdx === -1) return line;
                        return `${line.slice(0, eqIdx).trim()}=${line.slice(eqIdx + 1).trim()}`;
                    })
                    .join('\n');
            default:
                return content;
        }
    }
}
