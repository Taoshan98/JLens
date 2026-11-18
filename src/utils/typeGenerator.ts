const VALID_TS_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPascalCase(raw: string, fallback = 'Item'): string {
    const cleaned = raw
        .replace(/[^A-Za-z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    if (!cleaned) return fallback;
    if (/^\d/.test(cleaned)) return `${fallback}${cleaned}`;
    return cleaned;
}

function singularize(name: string): string {
    if (name.endsWith('ies') && name.length > 3) {
        return `${name.slice(0, -3)}y`;
    }
    if (name.endsWith('ses') && name.length > 3) {
        return name.slice(0, -2);
    }
    if (name.endsWith('s') && !name.endsWith('ss') && name.length > 1) {
        return name.slice(0, -1);
    }
    return name;
}

function formatPropertyKey(key: string): string {
    return VALID_TS_IDENTIFIER.test(key) ? key : JSON.stringify(key);
}

function allocateUniqueName(baseName: string, usedNames: Set<string>): string {
    const candidate = toPascalCase(baseName);
    if (!usedNames.has(candidate)) {
        usedNames.add(candidate);
        return candidate;
    }

    let suffix = 2;
    while (usedNames.has(`${candidate}${suffix}`)) {
        suffix++;
    }
    const unique = `${candidate}${suffix}`;
    usedNames.add(unique);
    return unique;
}

function dedupeTypes(types: string[]): string {
    const unique = Array.from(new Set(types));
    if (unique.length === 0) return 'unknown';
    if (unique.length === 1) return unique[0];
    return unique.join(' | ');
}

function wrapUnionForArray(typeExpr: string): string {
    if (typeExpr.includes(' | ') || typeExpr.includes('{')) {
        return `(${typeExpr})[]`;
    }
    return `${typeExpr}[]`;
}

export function generateTypeScript(data: unknown, rootName = 'Root'): string {
    const declarations: string[] = [];
    const usedNames = new Set<string>();

    const inferObjectInterface = (
        objects: Record<string, unknown>[],
        preferredName: string,
        exactName = false
    ): string => {
        const interfaceName = exactName
            ? (usedNames.add(toPascalCase(preferredName, 'Root')), toPascalCase(preferredName, 'Root'))
            : allocateUniqueName(preferredName, usedNames);

        const allKeys: string[] = [];
        const keyCounts = new Map<string, number>();
        const keyValues = new Map<string, unknown[]>();

        for (const obj of objects) {
            for (const [k, v] of Object.entries(obj)) {
                if (!keyCounts.has(k)) {
                    allKeys.push(k);
                    keyCounts.set(k, 0);
                    keyValues.set(k, []);
                }
                keyCounts.set(k, (keyCounts.get(k) || 0) + 1);
                keyValues.get(k)!.push(v);
            }
        }

        const lines: string[] = [];
        for (const key of allKeys) {
            const values = keyValues.get(key) || [];
            const isOptional = (keyCounts.get(key) || 0) < objects.length;
            const fieldType = inferFromSamples(values, key);
            lines.push(`  ${formatPropertyKey(key)}${isOptional ? '?' : ''}: ${fieldType};`);
        }

        const body = lines.length > 0 ? `{\n${lines.join('\n')}\n}` : '{}';
        declarations.push(`export interface ${interfaceName} ${body}`);
        return interfaceName;
    };

    const inferFromSamples = (samples: unknown[], hintName: string): string => {
        const objectSamples: Record<string, unknown>[] = [];
        const arraySamples: unknown[][] = [];
        const primitiveTypes: string[] = [];

        for (const sample of samples) {
            if (sample === null) {
                primitiveTypes.push('null');
            } else if (sample === undefined) {
                primitiveTypes.push('undefined');
            } else if (Array.isArray(sample)) {
                arraySamples.push(sample);
            } else if (isPlainObject(sample)) {
                objectSamples.push(sample);
            } else {
                primitiveTypes.push(typeof sample);
            }
        }

        const types = [...primitiveTypes];

        if (objectSamples.length > 0) {
            types.push(inferObjectInterface(objectSamples, hintName));
        }

        if (arraySamples.length > 0) {
            const flatItems = arraySamples.flat();
            if (flatItems.length === 0) {
                types.push('unknown[]');
            } else {
                const itemType = inferFromSamples(flatItems, singularize(hintName) || 'Item');
                types.push(wrapUnionForArray(itemType));
            }
        }

        return dedupeTypes(types);
    };

    if (isPlainObject(data)) {
        inferObjectInterface([data], rootName, true);
    } else if (Array.isArray(data)) {
        const safeRoot = toPascalCase(rootName, 'Root');
        usedNames.add(safeRoot);
        const itemType = data.length === 0
            ? 'unknown'
            : inferFromSamples(data, `${safeRoot}Item`);
        declarations.push(`export type ${safeRoot} = ${wrapUnionForArray(itemType)};`);
    } else {
        const safeRoot = toPascalCase(rootName, 'Root');
        const primitive = data === null ? 'null' : typeof data;
        declarations.push(`export type ${safeRoot} = ${primitive};`);
    }

    return declarations.reverse().join('\n\n');
}

interface JsonSchemaObject {
    $schema?: string;
    title?: string;
    type?: string | string[];
    properties?: Record<string, JsonSchemaObject>;
    required?: string[];
    items?: JsonSchemaObject;
    anyOf?: JsonSchemaObject[];
}

function mergeSchemas(schemas: JsonSchemaObject[]): JsonSchemaObject {
    if (schemas.length === 0) return {};
    if (schemas.length === 1) return schemas[0];

    const serialized = new Map<string, JsonSchemaObject>();
    for (const schema of schemas) {
        serialized.set(JSON.stringify(schema), schema);
    }
    const unique = Array.from(serialized.values());
    if (unique.length === 1) return unique[0];

    const allSimpleTyped = unique.every(
        (s) => typeof s.type === 'string' && !s.properties && !s.items && !s.anyOf
    );
    if (allSimpleTyped) {
        return {
            type: Array.from(new Set(unique.map((s) => s.type as string))),
        };
    }

    return { anyOf: unique };
}

function inferSchemaNode(samples: unknown[]): JsonSchemaObject {
    if (samples.length === 0) return {};

    const objects: Record<string, unknown>[] = [];
    const arrays: unknown[][] = [];
    const otherSchemas: JsonSchemaObject[] = [];

    for (const value of samples) {
        if (value === null) {
            otherSchemas.push({ type: 'null' });
        } else if (Array.isArray(value)) {
            arrays.push(value);
        } else if (isPlainObject(value)) {
            objects.push(value);
        } else if (typeof value === 'number') {
            otherSchemas.push({ type: Number.isInteger(value) ? 'integer' : 'number' });
        } else if (typeof value === 'string' || typeof value === 'boolean') {
            otherSchemas.push({ type: typeof value });
        }
    }

    const candidates: JsonSchemaObject[] = [...otherSchemas];

    if (objects.length > 0) {
        const keys: string[] = [];
        const counts = new Map<string, number>();
        const valuesByKey = new Map<string, unknown[]>();

        for (const obj of objects) {
            for (const [k, v] of Object.entries(obj)) {
                if (!counts.has(k)) {
                    keys.push(k);
                    counts.set(k, 0);
                    valuesByKey.set(k, []);
                }
                counts.set(k, (counts.get(k) || 0) + 1);
                valuesByKey.get(k)!.push(v);
            }
        }

        const properties: Record<string, JsonSchemaObject> = {};
        const required: string[] = [];
        for (const k of keys) {
            properties[k] = inferSchemaNode(valuesByKey.get(k) || []);
            if (counts.get(k) === objects.length) {
                required.push(k);
            }
        }

        const objSchema: JsonSchemaObject = {
            type: 'object',
            properties,
        };
        if (required.length > 0) {
            objSchema.required = required;
        }
        candidates.push(objSchema);
    }

    if (arrays.length > 0) {
        const flatItems = arrays.flat();
        candidates.push({
            type: 'array',
            items: flatItems.length > 0 ? inferSchemaNode(flatItems) : {},
        });
    }

    return mergeSchemas(candidates);
}

export function generateJsonSchema(data: unknown, title = 'Root'): string {
    const body = inferSchemaNode([data]);
    const schema: JsonSchemaObject = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        title,
        ...body,
    };
    return JSON.stringify(schema, null, 2);
}
