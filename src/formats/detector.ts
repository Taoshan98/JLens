import { Format } from '../types/formats';

const SAMPLE_CHARS = 8192;
const SAMPLE_LINES = 60;
const SMALL_JSON_PARSE_LIMIT = 65536;

function extractBoundedSample(trimmed: string): string {
    if (trimmed.length <= SAMPLE_CHARS) return trimmed;
    const slice = trimmed.slice(0, SAMPLE_CHARS);
    const lastNewline = slice.lastIndexOf('\n');
    return lastNewline > 0 ? slice.slice(0, lastNewline) : slice;
}

function splitDelimitedLine(
    line: string,
    delimiter: string
): { fields: string[]; unclosedQuote: boolean } {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === delimiter && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    fields.push(current);
    return { fields, unclosedQuote: inQuotes };
}

function isTomlValueLiteral(rawRhs: string): boolean {
    const rhs = rawRhs.trim();
    if (!rhs) return false;
    return (
        rhs.startsWith('"') ||
        rhs.startsWith("'") ||
        rhs.startsWith('[') ||
        rhs.startsWith('{') ||
        /^(?:true|false)(?:\s*#.*)?$/i.test(rhs) ||
        /^[+-]?(?:0[xob][\da-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)(?:\s*#.*)?$/.test(rhs) ||
        /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2})?/.test(rhs)
    );
}

function looksLikeToml(lines: string[]): boolean {
    if (lines.length === 0) return false;
    if (lines.some((line) => line.startsWith(';'))) return false;

    let assignmentCount = 0;
    let hasSection = false;
    let bracketDepth = 0;

    for (const line of lines) {
        if (line.startsWith('#')) continue;

        if (bracketDepth > 0) {
            for (const ch of line) {
                if (ch === '[' || ch === '{') bracketDepth++;
                else if (ch === ']' || ch === '}') bracketDepth--;
            }
            continue;
        }

        if (/^\[{1,2}[^\]]+\]{1,2}\s*(?:#.*)?$/.test(line)) {
            hasSection = true;
            continue;
        }

        const kv = line.match(/^(?:"[^"]+"|'[^']+'|[A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
        if (!kv) return false;

        const rhs = kv[1];
        if (!isTomlValueLiteral(rhs)) return false;
        assignmentCount++;

        for (const ch of rhs) {
            if (ch === '[' || ch === '{') bracketDepth++;
            else if (ch === ']' || ch === '}') bracketDepth--;
        }
    }

    return assignmentCount > 0 || hasSection;
}

function looksLikeCsv(lines: string[]): boolean {
    const subset = lines.slice(0, 25);
    if (subset.length < 2 || subset[0].startsWith('|')) return false;

    for (const delimiter of [',', ';', '\t'] as const) {
        if (!subset[0].includes(delimiter)) continue;
        const parsedRows = subset.map((line) => splitDelimitedLine(line, delimiter));
        if (parsedRows.some((r) => r.unclosedQuote)) continue;

        const colCount = parsedRows[0].fields.length;
        if (colCount < 2) continue;
        if (!parsedRows.every((r) => r.fields.length === colCount)) continue;

        const headerClean = parsedRows[0].fields.every((cell) => {
            const val = cell.trim();
            return val.length > 0 && val.length <= 60 && !/[!?]$/.test(val);
        });
        if (parsedRows.length >= 3 || headerClean) {
            return true;
        }
    }
    return false;
}

export function detectFormat(content: string): Format {
    const trimmed = content.trim();
    if (!trimmed) return Format.TEXT;

    const bounded = extractBoundedSample(trimmed);
    const sampleLines = bounded
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, SAMPLE_LINES);

    // 1. JSON (exact parse for <= 64KB, structural guard for large payloads)
    const isJsonWrapped =
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'));
    if (isJsonWrapped && trimmed.length <= SMALL_JSON_PARSE_LIMIT) {
        try {
            JSON.parse(trimmed);
            return Format.JSON;
        } catch {
            /* fall through to JSONL or other detectors */
        }
    }

    // 2. JSONL (NDJSON)
    if (sampleLines.length >= 2) {
        const looksJsonLines = sampleLines.every(
            (line) =>
                (line.startsWith('{') && line.endsWith('}')) ||
                (line.startsWith('[') && line.endsWith(']'))
        );
        if (looksJsonLines) {
            let parsedCount = 0;
            for (const line of sampleLines) {
                try {
                    JSON.parse(line);
                    parsedCount++;
                } catch {
                    /* individual broken line still reports JSONL line error */
                }
            }
            if (parsedCount >= 1) {
                return Format.JSONL;
            }
        }
    }

    if (isJsonWrapped && trimmed.length > SMALL_JSON_PARSE_LIMIT) {
        return Format.JSON;
    }

    // 3. HTML / XML
    if (trimmed.startsWith('<')) {
        if (
            /^(?:<!DOCTYPE\s+html|<html[\s>]|<(?:head|body|div|section|article|main|header|footer|nav|p|h[1-6]|ul|ol|table|form|script|style)[\s>])/i.test(
                bounded
            )
        ) {
            return Format.HTML;
        }
        if (
            /^<\?xml\b|^<[A-Za-z_][\w.:-]*(?:\s[^<>]*?)?\/>|^<[A-Za-z_][\w.:-]*(?:\s[^<>]*?)?>[\s\S]*(?:<\/[A-Za-z_][\w.:-]*>|<[A-Za-z_][\w.:-]*>)/m.test(
                bounded
            )
        ) {
            return Format.XML;
        }
    }

    // 4. Markdown with YAML Frontmatter
    if (/^---\r?\n[\s\S]+?\r?\n---\r?\n[\s\S]+/.test(bounded)) {
        return Format.MARKDOWN;
    }

    // 5. ENV (checked before TOML/INI for uppercase/export/unquoted KEY=VAL files)
    const hasIniSection = /^\[[^\]]+\]\s*$/m.test(bounded);
    const hasIniSemicolonComment = /^\s*;/m.test(bounded);
    if (!hasIniSection && !hasIniSemicolonComment && sampleLines.length > 0) {
        const envLinePattern = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/;
        const allEnvCompatible = sampleLines.every(
            (line) => line.startsWith('#') || envLinePattern.test(line)
        );
        const entries = sampleLines
            .filter((line) => !line.startsWith('#'))
            .map((line) => line.match(envLinePattern))
            .filter((m): m is RegExpMatchArray => m !== null);

        if (allEnvCompatible && entries.length > 0) {
            const hasExport = sampleLines.some((line) => /^export\s+/.test(line));
            const allUpperKeys = entries.every((m) => /^[A-Z][A-Z0-9_]*$/.test(m[1]));
            const hasNonTomlRhs = entries.some((m) => !isTomlValueLiteral(m[2]));
            if (hasExport || allUpperKeys || hasNonTomlRhs) {
                return Format.ENV;
            }
        }
    }

    // 6. TOML
    if (looksLikeToml(sampleLines)) {
        return Format.TOML;
    }

    // 7. CSV
    if (looksLikeCsv(sampleLines)) {
        return Format.CSV;
    }

    // 8. Markdown vs YAML disambiguation
    const yamlMappingKeyPattern = /^(?:-\s+)?(?:"[^"\n]+"|'[^'\n]+'|[\w.-]+)\s*:(?:\s|$)/;
    const yamlKeyLineCount = sampleLines.filter((line) => yamlMappingKeyPattern.test(line)).length;
    const hasStrongMarkdownSignals =
        (/^#{1,6}\s+.+/m.test(bounded) &&
            (/^#{2,6}\s+/m.test(bounded) ||
                /```[\s\S]*?```/.test(bounded) ||
                /\[.+?\]\(.+?\)/.test(bounded) ||
                /\*\*[^*\n]+?\*\*/.test(bounded) ||
                /^>\s/m.test(bounded) ||
                (yamlKeyLineCount === 0 && /^(?:[-*+]|\d+\.)\s+/m.test(bounded)))) ||
        /^\|.+\|\r?\n\|[-:| ]+\|/m.test(bounded);

    if (!hasStrongMarkdownSignals) {
        const hasIndentation = /^\s{2,}/m.test(bounded);
        const hasDocSeparator = /^---\s*$/m.test(bounded);
        if (
            yamlKeyLineCount >= 2 ||
            (yamlKeyLineCount === 1 && (hasIndentation || hasDocSeparator)) ||
            (sampleLines.length === 1 &&
                /^(?:"[^"\n]+"|'[^'\n]+'|[\w.-]+):\s+\S/.test(sampleLines[0]) &&
                !/^https?:\/\//i.test(sampleLines[0]))
        ) {
            return Format.YAML;
        }
    }

    // 9. SQL (strict statement prefix after optional comments, checked before INI)
    const sqlStatementPattern =
        /^\s*(?:(?:--[^\r\n]*|\/\*[\s\S]*?\*\/)\s*)*(?:SELECT\b[\s\S]+?\bFROM\b|SELECT\s+(?:[\d'"(@]|NOW\(|CURRENT_|VERSION\()|INSERT\s+INTO\s+\S+|UPDATE\s+\S+\s+SET\s+|DELETE\s+FROM\s+\S+|CREATE\s+(?:OR\s+REPLACE\s+)?(?:TEMP(?:ORARY)?\s+)?(?:TABLE|VIEW|INDEX|DATABASE|SCHEMA|FUNCTION|TRIGGER|PROCEDURE|TYPE)\b|ALTER\s+(?:TABLE|VIEW|DATABASE|SCHEMA|TYPE)\b|DROP\s+(?:TABLE|VIEW|INDEX|DATABASE|SCHEMA|FUNCTION|TRIGGER)\b|WITH\s+[A-Za-z_][\w]*\s+AS\s*\()/im;
    if (sqlStatementPattern.test(bounded)) {
        return Format.SQL;
    }

    // 10. INI
    if (
        bounded.includes('=') &&
        !bounded.includes('{') &&
        sampleLines.every(
            (line) =>
                line.startsWith(';') ||
                line.startsWith('#') ||
                /^\[[^\]]+\]$/.test(line) ||
                /^[A-Za-z0-9_.-]+\s*=/.test(line)
        )
    ) {
        return Format.INI;
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
        (acc, pattern) => acc + (pattern.test(bounded) ? 1 : 0),
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
        ].some((p) => p.test(bounded));
        if (hasBlock || matchCount >= 2) {
            return Format.MARKDOWN;
        }
    }

    return Format.TEXT;
}
