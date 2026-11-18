import { describe, it, expect } from 'vitest';
import { appendPointer, isAncestorPointer, toJqPath, toJsonPath } from '../jsonPath';
import { generateJsonSchema, generateTypeScript } from '../typeGenerator';

describe('jsonPath RFC 6901 pointer helpers', () => {
    it('prevents key collisions on dots and prefixes', () => {
        const dottedKey = appendPointer('', 'a.b');
        const nestedKey = appendPointer(appendPointer('', 'a'), 'b');

        expect(dottedKey).toBe('/a.b');
        expect(nestedKey).toBe('/a/b');
        expect(dottedKey).not.toBe(nestedKey);

        expect(isAncestorPointer('/user', '/user/name')).toBe(true);
        expect(isAncestorPointer('/user', '/user.name')).toBe(false);
        expect(isAncestorPointer('', '/a')).toBe(true);
        expect(isAncestorPointer('', '')).toBe(false);
    });

    it('escapes slashes and tildes in RFC 6901 pointers and renders JSONPath & jq paths', () => {
        const root = {
            users: [{ 'first.name': 'Ada', 'a/b': 1 }],
            '0': 'numeric-object-key',
        };

        const p1 = appendPointer(appendPointer(appendPointer('', 'users'), 0), 'first.name');
        expect(toJsonPath(p1, root)).toBe('$.users[0]["first.name"]');
        expect(toJqPath(p1, root)).toBe('.users[0]."first.name"');

        const p2 = appendPointer(appendPointer(appendPointer('', 'users'), 0), 'a/b');
        expect(p2).toBe('/users/0/a~1b');
        expect(toJsonPath(p2, root)).toBe('$.users[0]["a/b"]');

        const p3 = appendPointer('', '0');
        expect(toJsonPath(p3, root)).toBe('$["0"]');
        expect(toJqPath(p3, root)).toBe('."0"');
    });
});

describe('typeGenerator', () => {
    it('generates TypeScript interfaces with optional fields across heterogeneous array items', () => {
        const input = {
            service: 'jlens',
            items: [
                { id: 1, name: 'Tree' },
                { id: 2, name: 'Table', beta: true },
            ],
        };

        const ts = generateTypeScript(input, 'Config');
        expect(ts).toContain('export interface Item');
        expect(ts).toContain('beta?: boolean;');
        expect(ts).toContain('export interface Config');
        expect(ts).toContain('items: Item[];');
    });

    it('generates valid Draft 2020-12 JSON Schema', () => {
        const input = {
            count: 5,
            ratio: 0.75,
            tags: ['json', 'yaml'],
        };

        const schema = JSON.parse(generateJsonSchema(input, 'Payload'));
        expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
        expect(schema.title).toBe('Payload');
        expect(schema.properties.count.type).toBe('integer');
        expect(schema.properties.ratio.type).toBe('number');
        expect(schema.properties.tags).toEqual({
            type: 'array',
            items: { type: 'string' },
        });
        expect(schema.required).toEqual(['count', 'ratio', 'tags']);
    });
});
