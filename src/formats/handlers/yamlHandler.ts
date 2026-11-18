export function repairYamlIndent(content: string): string {
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

export async function parseYamlAsync(content: string): Promise<unknown> {
    const { parse } = await import('yaml');
    return parse(content);
}

export async function stringifyYamlAsync(data: unknown): Promise<string> {
    const { parse, stringify, parseDocument } = await import('yaml');

    if (typeof data === 'string') {
        try {
            const parsed = parse(data);
            return stringify(parsed);
        } catch {
            const repaired = repairYamlIndent(data);
            try {
                const parsedRepaired = parse(repaired);
                return stringify(parsedRepaired);
            } catch {
                const doc = parseDocument(data);
                return doc.errors.length === 0 ? doc.toString() : data;
            }
        }
    }

    return stringify(data);
}
