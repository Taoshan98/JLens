import { Format, FormatCategory, FORMATS } from '../types/formats';
import { stringifyJsonData, stringifyJsonlData } from './handlers/jsonHandler';
import { convertToEnv } from './handlers/envHandler';
import { stringifyYamlAsync } from './handlers/yamlHandler';
import { convertToXmlAsync } from './handlers/xmlHandler';
import { stringifyCsvAsync } from './handlers/csvHandler';
import { stringifyIniAsync, stringifyTomlAsync } from './handlers/tomlIniHandler';

export function getConvertibleTargets(sourceFormat: Format, data: unknown): Format[] {
    if (data === null || typeof data !== 'object') return [];
    return Object.values(FORMATS)
        .filter((def) => def.category === FormatCategory.DATA && def.id !== sourceFormat)
        .map((def) => def.id);
}

export async function convertDataAsync(data: unknown, targetFormat: Format): Promise<string> {
    if (data === null || data === undefined) return '';

    switch (targetFormat) {
        case Format.JSON:
            return stringifyJsonData(data);
        case Format.YAML:
            return stringifyYamlAsync(data);
        case Format.TOML:
            return stringifyTomlAsync(data);
        case Format.XML:
            return convertToXmlAsync(data);
        case Format.CSV:
            return stringifyCsvAsync(data);
        case Format.INI:
            return stringifyIniAsync(data);
        case Format.ENV:
            return convertToEnv(data);
        case Format.JSONL:
            return stringifyJsonlData(data);
        default:
            return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    }
}
