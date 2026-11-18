import { isPlainObject } from '../../utils/guards';

export function formatEnvValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (str === '' || /[\s#"'=`\r\n]/.test(str)) {
        return JSON.stringify(str);
    }
    return str;
}

export function parseEnvContent(content: string): Record<string, string> {
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

export function stringifyEnvData(data: unknown): string {
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

export function minifyEnvContent(content: string): string {
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
}

export function flattenToEnvEntries(
    value: unknown,
    prefix: string,
    out: Array<[string, unknown]>
): void {
    if (isPlainObject(value)) {
        for (const [k, v] of Object.entries(value)) {
            const normalizedKey =
                k
                    .replace(/[^A-Za-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '')
                    .toUpperCase() || 'KEY';
            const nextKey = prefix ? `${prefix}_${normalizedKey}` : normalizedKey;
            flattenToEnvEntries(v, nextKey, out);
        }
        return;
    }

    out.push([prefix || 'VALUE', value]);
}

export function convertToEnv(data: unknown): string {
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
