// Mock data for stringify logic test

// Mock the parser/builder since we are running in node via ts-node or similar, 
// but wait, FormatManager uses external libs that might need to be available.
// Actually, I can just copy the logic or require the file if I can run TS.
// Since I can't easily run TS files directly without setup, I'll create a JS test script 
// that mimics the logic I just added to verify it, OR I can try to run the app again.
// Let's rely on the browser verification which is more integrated.
// But a quick unit test logic check in JS is safer.

const data = {
    "html": {
        "body": {
            "h1": "Utente",
            "ul": [
                { "li": "ID: 1" },
                { "li": "Nome: Mario" }
            ],
            "div": {
                "@_class": "container",
                "#text": "Content"
            }
        }
    }
};

function toEnvString(data, prefix = '') {
    let result = '';
    for (const key in data) {
        const value = data[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
            result += toEnvString(value, newKey);
        } else {
            result += `${newKey}=${String(value)}\n`;
        }
    }
    return result;
}

function toMarkdownString(data, depth = 1) {
    let result = '';

    if (Array.isArray(data)) {
        data.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                result += toMarkdownString(item, depth);
            } else {
                result += `${'  '.repeat(depth - 1)}- ${String(item)}\n`;
            }
        });
        return result;
    }

    for (const key in data) {
        const value = data[key];
        const headerPrefix = '#'.repeat(Math.min(depth + 1, 6));

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            if (key.startsWith('@_') || key === '#text') {
                result += `${'  '.repeat(depth)}- **${key}**: ${String(value)}\n`;
            } else {
                result += `\n${headerPrefix} ${key}\n\n`;
                result += toMarkdownString(value, depth + 1);
            }
        } else if (Array.isArray(value)) {
            result += `\n${headerPrefix} ${key}\n\n`;
            value.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    result += toMarkdownString(item, depth + 1);
                } else {
                    result += `- ${String(item)}\n`;
                }
            });
        } else {
            result += `- **${key}**: ${String(value)}\n`;
        }
    }
    return result;
}

console.log("--- ENV ---");
console.log(toEnvString(data));
console.log("\n--- MARKDOWN ---");
console.log(toMarkdownString(data));
