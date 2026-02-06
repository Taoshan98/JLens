import { parse as parseYaml, stringify as stringifyYaml, parseDocument } from 'yaml';
import * as toml from 'smol-toml';
import Papa from 'papaparse';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import * as ini from 'ini';
import { format as formatSql } from 'sql-formatter';
import { html_beautify } from 'js-beautify';
import { Format, FORMATS } from '../types/formats';

export class FormatManager {
    private static xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    });

    private static xmlBuilder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true
    });

    static detect(content: string): Format {
        const trimmed = content.trim();
        if (!trimmed) return Format.TEXT;

        // 1. JSON (Fast check)
        if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && (trimmed.endsWith('}') || trimmed.endsWith(']'))) {
            try {
                JSON.parse(trimmed);
                return Format.JSON;
            } catch { }
        }

        // 2. XML / HTML
        if (trimmed.startsWith('<')) {
            // Simple heuristic: if it has standard HTML tags, it's HTML, otherwise XML
            if (/<!DOCTYPE html>|<html/i.test(trimmed)) return Format.HTML;
            try {
                // fast-xml-parser doesn't throw on some invalid XML, so we need to be careful.
                // But usually validation works.
                const p = new XMLParser;
                // Validating first
                if (p.parse(trimmed)) return Format.XML; // parse returns object, if successful
            } catch { }
        }

        // 3. TOML used to be checked before YAML because YAML accepts almost anything
        // But checking TOML structure:
        try {
            // smol-toml throws on invalid
            const res = toml.parse(trimmed);
            // TOML usually is an object
            if (typeof res === 'object' && res !== null && Object.keys(res).length > 0) return Format.TOML;
        } catch { }

        // 4. YAML
        try {
            const res = parseYaml(trimmed);
            if (typeof res === 'object' && res !== null) return Format.YAML;
        } catch { }

        // 4b. Pseudo-YAML Heuristic
        // If it failed strict parsing but looks like YAML (keys with colons, indentation), 
        // we might want to return YAML so the validator can show the specific error.
        // Regex: looks for "key: value" or "key:\n  value" patterns.
        const yamlHeuristic = /^[\w-]+\s*:\s*(?:$|[^\s])/m;
        if (yamlHeuristic.test(trimmed) && trimmed.includes('\n')) {
            // Avoid false positives with simple text like "Note: this is text"
            // Require at least 2 distinct key-value pairs OR nested structure
            const colonCount = (trimmed.match(/:/g) || []).length;
            const hasIndentation = /^\s{2,}/m.test(trimmed);
            if (colonCount >= 2 || hasIndentation) {
                return Format.YAML;
            }
        }

        // 5. ENV
        // Moved before INI because INI check is very loose (allows key=value without sections)
        // ENV heuristic: Every line must be empty, comment (#...), or contain '='
        const lines = trimmed.split('\n');
        const isEnv = lines.every(l => {
            const line = l.trim();
            return !line || line.startsWith('#') || line.includes('=');
        });

        if (isEnv) {
            // Further validation: Ensure valid keys? 
            // Usually ENV keys should not contain spaces before '='? 
            // But let's stick to "everything looks like KEY=VAL or comment"
            // Also ensure at least one "=" exists to distinguish from just a list of comments
            if (lines.some(l => l.includes('='))) return Format.ENV;
        }

        // 6. INI (Loose)
        if (trimmed.includes('=') && !trimmed.includes('{')) {
            try {
                const res = ini.parse(trimmed);
                if (Object.keys(res).length > 0) return Format.INI;
            } catch { }
        }

        // 7. SQL
        if (/SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER/i.test(trimmed)) {
            return Format.SQL;
        }

        // 9. Markdown (Heuristic)
        // Check for common markdown patterns: headers, lists, code blocks, blockquotes, links
        const mdPatterns = [
            /^#{1,6}\s/m,                   // Headers
            /^[-*+]\s/m,                    // Unordered lists
            /^\d+\.\s/m,                    // Ordered lists
            /^>\s/m,                        // Blockquotes
            /```[\s\S]*?```/,               // Code blocks
            /\[.+?\]\(.+?\)/,               // Links
            /\*\*.+?\*\*/,                  // Bold
            /_{2}.+?_{2}/,                  // Bold (underscore)
            /`[^`\n]+?`/                    // Inline code
        ];

        // If at least one strong indicator or multiple weak indicators are found
        const matchCount = mdPatterns.reduce((acc, pattern) => acc + (pattern.test(trimmed) ? 1 : 0), 0);

        if (matchCount >= 1) {
            // Further refinement: if it's just a single list item or bold text, it might be text
            // But usually good enough for "Paste. Explore." context.
            // Let's require at least one "block" level element (header, list, quote, code block) OR multiple inline elements
            const hasBlock = [/^#{1,6}\s/m, /^[-*+]\s/m, /^\d+\.\s/m, /^>\s/m, /```[\s\S]*?```/].some(p => p.test(trimmed));
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
            case Format.XML:
                return FormatManager.xmlParser.parse(content);
            case Format.CSV:
                return Papa.parse(content, { header: true, skipEmptyLines: true }).data;
            case Format.INI:
                return ini.parse(content);
            case Format.ENV:
                // Simple manual parse for env files to object
                return content.split('\n').reduce((acc: any, line) => {
                    const [key, ...vals] = line.split('=');
                    if (key && vals.length > 0) {
                        acc[key.trim()] = vals.join('=').trim();
                    }
                    return acc;
                }, {});
            case Format.JSONL:
                return content.trim().split('\n').map(line => {
                    try { return JSON.parse(line); } catch { return null; }
                }).filter(x => x !== null);
            default:
                // For DOCUMENT and CODE formats, we just return the string itself or null
                // because the Tree Viewer can't natively visualize a raw string nicely without structure.
                // However, we want to allow the "Viewer" to handle it.
                // If we return the string, JsonTree might just show a string node.
                return content;
        }
    }

    static stringify(data: unknown, format: Format): string {
        if (data === null || data === undefined) return '';

        switch (format) {
            case Format.JSON:
                if (typeof data === 'string') {
                    // It might be invalid JSON string if coming from recovery attempts.
                    // Try to parse/stringify to beautify, else return valid string.
                    try { return JSON.stringify(JSON.parse(data), null, 2); } catch { return data; }
                }
                return JSON.stringify(data, null, 2);
            case Format.YAML:
                // If data is a string (e.g. invalid content passed for robust formatting), use parseDocument
                if (typeof data === 'string') {
                    // 1. Try standard parser first
                    try {
                        const parsed = parseYaml(data);
                        return stringifyYaml(parsed);
                    } catch {
                        // 2. Try experimental repair for common indentation issues
                        const repaired = FormatManager.repairIndent(data);
                        try {
                            const parsedRepaired = parseYaml(repaired);
                            return stringifyYaml(parsedRepaired);
                        } catch {
                            // 3. Fallback to CST stringify (preserves errors but might format partially)
                            const doc = parseDocument(data);
                            return doc.toString();
                        }
                    }
                }
                return stringifyYaml(data);
            case Format.TOML:
                return toml.stringify(data as any);
            case Format.XML:
                return FormatManager.xmlBuilder.build(data);
            case Format.CSV:
                return Papa.unparse(data as any);
            case Format.INI:
                return ini.stringify(data);
            case Format.SQL:
                return typeof data === 'string' ? formatSql(data) : '';
            case Format.HTML:
                return typeof data === 'string' ? html_beautify(data, {
                    indent_size: 2,
                    wrap_line_length: 80
                }) : '';
            default:
                // For others, we might assume data is already string
                if (typeof data === 'string') return data;
                return JSON.stringify(data, null, 2); // Fallback
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

            // Detect current line specs
            const match = line.match(/^(\s*)(.*)$/);
            const currentIndent = match ? match[1].length : 0;
            const contentPart = match ? match[2] : '';

            // Check if this line looks like a key-value pair
            // Supports unquoted keys ([\w-]+) or quoted keys ("..." or '...')
            const isKeyPair = /^(".*?"|'.*?'|[\w-]+):\s/.test(contentPart);

            // If we have a tracked scalar parent, and this line is deeper indented and looks like a key, it's the bug.
            if (lastScalarIndent !== -1 && currentIndent > lastScalarIndent && isKeyPair) {
                // Fix: Dedent to match lastScalarIndent
                const dedented = ' '.repeat(lastScalarIndent) + contentPart;
                result.push(dedented);

                // The corrected line is at lastScalarIndent. Check if it is itself a scalar.
                const isScalar = /^(".*?"|'.*?'|[\w-]+):\s+(?![|>]).+$/.test(contentPart);
                if (isScalar) {
                    // It is a scalar, so it becomes the new parent
                    lastScalarIndent = lastScalarIndent;
                } else {
                    // It is likely a block parent or something else.
                    // If it's a block parent `key:`, future lines should be indented relative to it.
                    // But we are tracking "scalar parent", so we stop tracking because this line is NOT a scalar parent.
                    lastScalarIndent = -1;
                }
            } else {
                result.push(line);
                // Update tracking

                // Is this line a scalar key: value?
                // Regex checks for key + colon + space + content (that isn't a block indicator)
                const isScalar = /^(".*?"|'.*?'|[\w-]+):\s+(?![|>]).+$/.test(contentPart);

                if (isScalar) {
                    lastScalarIndent = currentIndent;
                } else {
                    // If we indent block `key:`, we enter a block.
                    // If we dedent back to or above `lastScalarIndent`, we have left the scope of that scalar.
                    if (currentIndent <= lastScalarIndent) {
                        lastScalarIndent = -1;
                    }
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
            case Format.SQL:
                // Remove comments
                let sql = content.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
                // Replace multiple spaces/newlines with single space
                sql = sql.replace(/\s+/g, ' ').trim();
                return sql;
            case Format.XML:
                // Simple regex minification for XML
                return content.replace(/>\s+</g, '><').trim();
            case Format.HTML:
                // Remove comments
                let html = content.replace(/<!--[\s\S]*?-->/g, '');
                // Collapse whitespace between tags
                html = html.replace(/>\s+</g, '><');
                // Trim
                return html.replace(/\s+/g, ' ').trim();
            default:
                // For other formats, naive whitespace collapse or return original
                return content;
        }
    }
}
