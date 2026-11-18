import { isPlainObject } from '../../utils/guards';

export function minifyXmlContent(content: string): string {
    return content.replace(/>\s+</g, '><').trim();
}

export async function parseXmlAsync(content: string): Promise<unknown> {
    const { XMLParser, XMLValidator } = await import('fast-xml-parser');
    const validation = XMLValidator.validate(content);
    if (validation !== true) {
        throw new Error(
            `XML Error (line ${validation.err.line}, col ${validation.err.col}): ${validation.err.msg}`
        );
    }

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    });
    return parser.parse(content);
}

export async function stringifyXmlAsync(data: unknown): Promise<string> {
    if (typeof data === 'string') return data;
    const { XMLBuilder } = await import('fast-xml-parser');
    const builder = new XMLBuilder({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        format: true,
    });
    return builder.build(data);
}

export async function convertToXmlAsync(data: unknown): Promise<string> {
    if (Array.isArray(data)) {
        return stringifyXmlAsync({ root: { item: data } });
    }
    if (isPlainObject(data)) {
        const keys = Object.keys(data);
        const wrapped = keys.length === 1 ? data : { root: data };
        return stringifyXmlAsync(wrapped);
    }
    return stringifyXmlAsync({ root: data });
}
