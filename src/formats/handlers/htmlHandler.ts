const VOID_HTML_TAGS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);

function protectRawBlocks(content: string): {
    protectedContent: string;
    restore: (output: string) => string;
} {
    const preservedBlocks: string[] = [];
    let sentinelPrefix = '__JLENS_HTML_BLOCK_';
    while (content.includes(sentinelPrefix)) {
        sentinelPrefix += '_';
    }

    const protectedContent = content.replace(
        /<(pre|code|textarea|script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
        (block) => {
            const token = `${sentinelPrefix}${preservedBlocks.length}__`;
            preservedBlocks.push(block);
            return token;
        }
    );

    const restoreRegex = new RegExp(`${sentinelPrefix}(\\d+)__`, 'g');
    const restore = (output: string) =>
        output.replace(restoreRegex, (_m, idx: string) => preservedBlocks[Number(idx)] ?? '');

    return { protectedContent, restore };
}

export function formatHtmlContent(html: string): string {
    if (!html.trim()) return '';
    const { protectedContent, restore } = protectRawBlocks(html);
    const tokens = protectedContent.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) ?? [];

    const lines: string[] = [];
    let depth = 0;

    for (let i = 0; i < tokens.length; i++) {
        const rawToken = tokens[i];
        const trimmed = rawToken.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('</')) {
            depth = Math.max(0, depth - 1);
            lines.push(`${'  '.repeat(depth)}${trimmed}`);
            continue;
        }

        if (trimmed.startsWith('<!') || trimmed.startsWith('<?')) {
            lines.push(`${'  '.repeat(depth)}${trimmed}`);
            continue;
        }

        if (trimmed.startsWith('<')) {
            const tagMatch = trimmed.match(/^<([A-Za-z0-9:-]+)/);
            const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
            const isSelfClosing = trimmed.endsWith('/>') || VOID_HTML_TAGS.has(tagName);

            if (!isSelfClosing && i + 2 < tokens.length) {
                const nextText = tokens[i + 1];
                const afterClose = tokens[i + 2].trim();
                const isInlineTextPair =
                    !nextText.trim().startsWith('<') &&
                    afterClose.toLowerCase() === `</${tagName}>` &&
                    trimmed.length + nextText.trim().length + afterClose.length <= 80;

                if (isInlineTextPair) {
                    lines.push(`${'  '.repeat(depth)}${trimmed}${nextText.trim()}${afterClose}`);
                    i += 2;
                    continue;
                }
            }

            lines.push(`${'  '.repeat(depth)}${trimmed}`);
            if (!isSelfClosing) {
                depth++;
            }
            continue;
        }

        const collapsedText = trimmed.replace(/\s+/g, ' ');
        lines.push(`${'  '.repeat(depth)}${collapsedText}`);
    }

    return restore(lines.join('\n'));
}

export function minifyHtmlContent(html: string): string {
    const { protectedContent, restore } = protectRawBlocks(html);

    const compacted = protectedContent
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/>\s+</g, '><')
        .replace(/\s+/g, ' ')
        .trim();

    return restore(compacted);
}
