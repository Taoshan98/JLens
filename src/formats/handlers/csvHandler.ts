import { isPlainObject } from '../../utils/guards';

export function flattenForCsvRow(value: unknown): Record<string, unknown> {
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

export async function parseCsvAsync(content: string): Promise<Record<string, unknown>[]> {
    const { default: Papa } = await import('papaparse');
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

export async function stringifyCsvAsync(data: unknown): Promise<string> {
    if (typeof data === 'string') return data;
    const { default: Papa } = await import('papaparse');
    const rows = Array.isArray(data)
        ? data.map((row) => flattenForCsvRow(row))
        : [flattenForCsvRow(data)];
    return Papa.unparse<Record<string, unknown>>(rows);
}
