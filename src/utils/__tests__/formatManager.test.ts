import { describe, it, expect } from 'vitest';
import { FormatManager } from '../formatManager';
import { Format } from '../../types/formats';

describe('FormatManager.detect', () => {
    it('detects empty input as TEXT', () => {
        expect(FormatManager.detect('   \n  ')).toBe(Format.TEXT);
    });

    it('detects JSON objects and arrays', () => {
        expect(FormatManager.detect('{"a": 1, "b": true}')).toBe(Format.JSON);
        expect(FormatManager.detect('[1, 2, 3]')).toBe(Format.JSON);
    });

    it('detects large payloads via bounded sampling without slowing down', () => {
        const huge = `{"items": [${Array.from({ length: 5000 }, (_, i) => `{"id":${i}}`).join(',')}]}`;
        expect(FormatManager.detect(huge)).toBe(Format.JSON);
    });

    it('detects JSONL (NDJSON) including lines with errors when majority parse', () => {
        const jsonl = '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}';
        expect(FormatManager.detect(jsonl)).toBe(Format.JSONL);

        const brokenJsonl = '{"id":1}\n{"id":2';
        expect(FormatManager.detect(brokenJsonl)).not.toBe(Format.JSON);

        const brokenMiddleJsonl = '{"id":1}\n{bad}\n{"id":3}';
        expect(FormatManager.detect(brokenMiddleJsonl)).toBe(Format.JSONL);
    });

    it('detects XML and HTML distinctly', () => {
        expect(FormatManager.detect('<note><to>User</to></note>')).toBe(Format.XML);
        expect(FormatManager.detect('<!DOCTYPE html><html><body><h1>Hi</h1></body></html>')).toBe(
            Format.HTML
        );
        expect(FormatManager.detect('<div class="card"><p>Hello</p></div>')).toBe(Format.HTML);
        expect(FormatManager.detect('<root><unclosed>')).toBe(Format.XML);
    });

    it('detects CSV with comma and semicolon delimiters without false-positiving prose', () => {
        const commaCsv = 'name,age,city\nAlice,30,Rome\nBob,25,Milan';
        expect(FormatManager.detect(commaCsv)).toBe(Format.CSV);

        const semiCsv = 'id;title;done\n1;Task A;true\n2;Task B;false';
        expect(FormatManager.detect(semiCsv)).toBe(Format.CSV);

        const quotedCsv = '"name, full",role\n"Ada, L.",Engineer\n"Linus, T.",Maintainer';
        expect(FormatManager.detect(quotedCsv)).toBe(Format.CSV);

        const proseWithCommas = 'Hello, world!\nGoodbye, world!';
        expect(FormatManager.detect(proseWithCommas)).toBe(Format.TEXT);
    });

    it('detects TOML, YAML, INI, and ENV properly', () => {
        expect(FormatManager.detect('[server]\nhost = "localhost"\nport = 8080')).toBe(Format.TOML);
        expect(FormatManager.detect('server:\n  host: localhost\n  port: 8080')).toBe(Format.YAML);
        expect(FormatManager.detect('; comment\n[section]\nkey=value')).toBe(Format.INI);
        expect(FormatManager.detect('# Database\nPORT=5432\nHOST=localhost')).toBe(Format.ENV);
    });

    it('detects valid SQL statements and rejects prose or Markdown false positives', () => {
        expect(FormatManager.detect('SELECT id, name FROM users WHERE active = true;')).toBe(
            Format.SQL
        );
        expect(FormatManager.detect('-- query\nCREATE TABLE items (id INT PRIMARY KEY);')).toBe(
            Format.SQL
        );
        expect(
            FormatManager.detect('Please select an option and update the backdrop color.')
        ).toBe(Format.TEXT);
        expect(FormatManager.detect('# Project Update\n- Select item\n- Create build')).toBe(
            Format.MARKDOWN
        );
    });

    it('detects Markdown with frontmatter or GFM tables', () => {
        const mdFrontmatter = '---\ntitle: Hello\n---\n\n# Welcome\nSome **bold** text.';
        expect(FormatManager.detect(mdFrontmatter)).toBe(Format.MARKDOWN);

        const mdTable = '| Name | Role |\n| --- | --- |\n| Ada | Dev |';
        expect(FormatManager.detect(mdTable)).toBe(Format.MARKDOWN);
    });
});

describe('FormatManager.parseAsync & detectAndParseAsync', () => {
    it('detects and parses in a single pass', async () => {
        const res = await FormatManager.detectAndParseAsync('{"ok": true, "n": 42}');
        expect(res.format).toBe(Format.JSON);
        expect(res.data).toEqual({ ok: true, n: 42 });
    });

    it('throws detailed error for malformed XML via XMLValidator', async () => {
        await expect(FormatManager.parseAsync('<root><unclosed>', Format.XML)).rejects.toThrow(
            /XML Error/
        );
    });

    it('parses ENV ignoring comments, unwrapping quotes, and stripping inline comments', async () => {
        const env =
            '# PORT=9999\nexport APP_NAME="JLens App"\nAPI_KEY=\'secret\'\nPORT=3000 # local port';
        const parsed = (await FormatManager.parseAsync(env, Format.ENV)) as Record<string, string>;
        expect(parsed).toEqual({
            APP_NAME: 'JLens App',
            API_KEY: 'secret',
            PORT: '3000',
        });
        expect(parsed['# PORT']).toBeUndefined();
    });

    it('throws on invalid JSONL line and preserves literal null values', async () => {
        const valid = '{"ok":true}\nnull\n42';
        await expect(FormatManager.parseAsync(valid, Format.JSONL)).resolves.toEqual([
            { ok: true },
            null,
            42,
        ]);

        const invalid = '{"ok":true}\n{broken}';
        await expect(FormatManager.parseAsync(invalid, Format.JSONL)).rejects.toThrow(/line 2/);
    });
});

describe('FormatManager.stringifyAsync & minify', () => {
    it('formats and minifies ENV and JSONL without turning them into JSON', async () => {
        const envObj = { PORT: 3000, APP_NAME: 'My App' };
        await expect(FormatManager.stringifyAsync(envObj, Format.ENV)).resolves.toBe(
            'PORT=3000\nAPP_NAME="My App"'
        );

        const rawEnv = '# comment\n\n  PORT = 3000 \nHOST = localhost ';
        expect(FormatManager.minify(rawEnv, Format.ENV)).toBe('PORT=3000\nHOST=localhost');

        const jsonl = '  { "a": 1 } \n\n [1, 2] ';
        expect(FormatManager.minify(jsonl, Format.JSONL)).toBe('{"a":1}\n[1,2]');
        await expect(
            FormatManager.stringifyAsync([{ a: 1 }, { b: 2 }], Format.JSONL)
        ).resolves.toBe('{"a":1}\n{"b":2}');
    });

    it('repairs scalar indentation bug in YAML', async () => {
        const brokenYaml = 'name: app\n  version: 1.0\n  nested:\n    enabled: true';
        const formatted = await FormatManager.stringifyAsync(brokenYaml, Format.YAML);
        expect(formatted).toContain('name: app');
        expect(formatted).toContain('version: 1');
        expect(formatted).toContain('enabled: true');
    });

    it('formats HTML cleanly without js-beautify while preserving <pre>', async () => {
        const html = '<div><p>Hello</p><br><pre>  keep\n  indent</pre></div>';
        const formatted = await FormatManager.stringifyAsync(html, Format.HTML);
        expect(formatted).toContain('<div>\n  <p>Hello</p>\n  <br>\n  <pre>  keep\n  indent</pre>\n</div>');
    });

    it('minifies SQL without stripping string literal contents', () => {
        const sql = "SELECT '-- keep   spaces' AS note -- drop this comment\nFROM users;";
        expect(FormatManager.minify(sql, Format.SQL)).toBe(
            "SELECT '-- keep   spaces' AS note FROM users;"
        );
    });

    it('minifies HTML while preserving whitespace inside <pre> and <code>', () => {
        const html = '<div> <!-- comment --> <p> Hi </p> <pre>  line 1\n  line 2  </pre> </div>';
        const minified = FormatManager.minify(html, Format.HTML);
        expect(minified).not.toContain('comment');
        expect(minified).toContain('<pre>  line 1\n  line 2  </pre>');
    });
});

describe('FormatManager.convertAsync', () => {
    it('converts structured JSON data to YAML, TOML (stripping nulls), CSV, XML, and ENV', async () => {
        const sample = {
            app: { name: 'JLens', port: 3000, optional: null },
            debug: true,
        };

        const yamlOut = await FormatManager.convertAsync(sample, Format.YAML);
        await expect(FormatManager.parseAsync(yamlOut, Format.YAML)).resolves.toEqual(sample);

        const tomlOut = await FormatManager.convertAsync(sample, Format.TOML);
        expect(tomlOut).toContain('name = "JLens"');
        expect(tomlOut).not.toContain('optional');

        const xmlOut = await FormatManager.convertAsync(sample, Format.XML);
        expect(xmlOut).toContain('<root>');
        expect(xmlOut).toContain('<name>JLens</name>');

        const envOut = await FormatManager.convertAsync(sample, Format.ENV);
        expect(envOut).toContain('APP_NAME=JLens');
        expect(envOut).toContain('APP_PORT=3000');
        expect(envOut).toContain('DEBUG=true');

        const rows = [
            { id: 1, name: 'Ada' },
            { id: 2, name: 'Linus' },
        ];
        const csvOut = await FormatManager.convertAsync(rows, Format.CSV);
        expect(csvOut).toContain('id,name');
        expect(csvOut).toContain('1,Ada');
    });
});
