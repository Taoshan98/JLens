export function parseJsonContent(content: string): unknown {
    return JSON.parse(content);
}

export function stringifyJsonData(data: unknown): string {
    if (typeof data === 'string') {
        try {
            return JSON.stringify(JSON.parse(data), null, 2);
        } catch {
            return data;
        }
    }
    return JSON.stringify(data, null, 2);
}

export function minifyJsonContent(content: string): string {
    try {
        return JSON.stringify(JSON.parse(content));
    } catch {
        return content;
    }
}

export function parseJsonlContent(content: string): unknown[] {
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

export function stringifyJsonlData(data: unknown): string {
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

export function minifyJsonlContent(content: string): string {
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
}
