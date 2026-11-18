const VALID_JS_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const VALID_JQ_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ARRAY_INDEX = /^(?:0|[1-9]\d*)$/;

export function encodePointerSegment(segment: string): string {
    return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

export function decodePointerSegment(segment: string): string {
    return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

export function appendPointer(parentPointer: string, segment: string | number): string {
    return `${parentPointer}/${encodePointerSegment(String(segment))}`;
}

export function isAncestorPointer(ancestor: string, target: string): boolean {
    if (!target) return false;
    if (ancestor === '') return target.startsWith('/');
    return target.startsWith(`${ancestor}/`);
}

export function pointerToSegments(pointer: string): string[] {
    if (!pointer) return [];
    if (!pointer.startsWith('/')) return [pointer];
    return pointer.slice(1).split('/').map(decodePointerSegment);
}

export function toJsonPath(pointer: string, dataRoot?: unknown): string {
    const segments = pointerToSegments(pointer);
    if (segments.length === 0) return '$';

    let path = '$';
    let current: unknown = dataRoot;

    for (const seg of segments) {
        const isKnownArray = Array.isArray(current);
        const isInferredArray = dataRoot === undefined && ARRAY_INDEX.test(seg);

        if ((isKnownArray || isInferredArray) && ARRAY_INDEX.test(seg)) {
            path += `[${seg}]`;
        } else if (VALID_JS_IDENTIFIER.test(seg)) {
            path += `.${seg}`;
        } else {
            path += `[${JSON.stringify(seg)}]`;
        }

        if (current !== null && typeof current === 'object') {
            current = (current as Record<string, unknown>)[seg];
        } else {
            current = undefined;
        }
    }

    return path;
}

export function toJqPath(pointer: string, dataRoot?: unknown): string {
    const segments = pointerToSegments(pointer);
    if (segments.length === 0) return '.';

    let path = '';
    let current: unknown = dataRoot;

    for (const seg of segments) {
        const isKnownArray = Array.isArray(current);
        const isInferredArray = dataRoot === undefined && ARRAY_INDEX.test(seg);

        if ((isKnownArray || isInferredArray) && ARRAY_INDEX.test(seg)) {
            path = path ? `${path}[${seg}]` : `.[${seg}]`;
        } else if (VALID_JQ_IDENTIFIER.test(seg)) {
            path += `.${seg}`;
        } else {
            path += `.${JSON.stringify(seg)}`;
        }

        if (current !== null && typeof current === 'object') {
            current = (current as Record<string, unknown>)[seg];
        } else {
            current = undefined;
        }
    }

    return path || '.';
}
