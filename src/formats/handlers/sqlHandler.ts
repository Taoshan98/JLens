export async function formatSqlAsync(sql: string): Promise<string> {
    const { format } = await import('sql-formatter');
    return format(sql);
}

export function minifySqlContent(content: string): string {
    const tokenRegex =
        /('(?:''|[^'])*'|"(?:""|[^"])*"|`[^`]*`)|(?:--[^\r\n]*|\/\*[\s\S]*?\*\/|\s)+/g;
    return content
        .replace(tokenRegex, (_match, literal: string | undefined) => {
            if (literal !== undefined) return literal;
            return ' ';
        })
        .replace(/\s+([,;()])/g, '$1')
        .replace(/\(\s+/g, '(')
        .trim();
}
