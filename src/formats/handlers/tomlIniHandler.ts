import { isPlainObject } from '../../utils/guards';

export function sanitizeForToml(value: unknown): unknown {
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

export async function parseTomlAsync(content: string): Promise<Record<string, unknown>> {
    const toml = await import('smol-toml');
    return toml.parse(content);
}

export async function stringifyTomlAsync(data: unknown): Promise<string> {
    if (typeof data === 'string') return data;
    const toml = await import('smol-toml');
    const sanitized = sanitizeForToml(data);
    const table = isPlainObject(sanitized) ? sanitized : { items: sanitized };
    return toml.stringify(table);
}

export async function parseIniAsync(content: string): Promise<Record<string, unknown>> {
    const ini = await import('ini');
    return ini.parse(content) as Record<string, unknown>;
}

export async function stringifyIniAsync(data: unknown): Promise<string> {
    if (typeof data === 'string') return data;
    const ini = await import('ini');
    const target = Array.isArray(data) ? { items: data } : data;
    return ini.stringify(target);
}
