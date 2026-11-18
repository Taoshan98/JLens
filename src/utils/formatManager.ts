import { Format, FORMATS } from '../types/formats';
import { detectFormat } from '../formats/detector';
import { convertDataAsync, getConvertibleTargets } from '../formats/converter';
import {
    minifyJsonContent,
    minifyJsonlContent,
    parseJsonContent,
    parseJsonlContent,
    stringifyJsonData,
    stringifyJsonlData,
} from '../formats/handlers/jsonHandler';
import {
    minifyEnvContent,
    parseEnvContent,
    stringifyEnvData,
} from '../formats/handlers/envHandler';
import { formatHtmlContent, minifyHtmlContent } from '../formats/handlers/htmlHandler';
import { formatSqlAsync, minifySqlContent } from '../formats/handlers/sqlHandler';
import { parseYamlAsync, stringifyYamlAsync } from '../formats/handlers/yamlHandler';
import { minifyXmlContent, parseXmlAsync, stringifyXmlAsync } from '../formats/handlers/xmlHandler';
import { parseCsvAsync, stringifyCsvAsync } from '../formats/handlers/csvHandler';
import {
    parseIniAsync,
    parseTomlAsync,
    stringifyIniAsync,
    stringifyTomlAsync,
} from '../formats/handlers/tomlIniHandler';

export class FormatManager {
    static detect(content: string): Format {
        return detectFormat(content);
    }

    static canFormat(format: Format): boolean {
        return format !== Format.TEXT && format !== Format.MARKDOWN;
    }

    static canMinify(format: Format): boolean {
        return (
            format === Format.JSON ||
            format === Format.JSONL ||
            format === Format.XML ||
            format === Format.HTML ||
            format === Format.SQL ||
            format === Format.ENV
        );
    }

    static getLanguage(format: Format): string {
        return FORMATS[format].editorLanguage || 'text';
    }

    static getConvertibleTargets(sourceFormat: Format, data: unknown): Format[] {
        return getConvertibleTargets(sourceFormat, data);
    }

    static async detectAndParseAsync(
        content: string,
        explicitFormat?: Format
    ): Promise<{ format: Format; data: unknown }> {
        if (!content.trim()) {
            return { format: explicitFormat ?? Format.TEXT, data: null };
        }
        const format = explicitFormat || FormatManager.detect(content);
        const data = await FormatManager.parseAsync(content, format);
        return { format, data };
    }

    static async parseAsync(content: string, format: Format): Promise<unknown> {
        if (!content.trim()) return null;

        switch (format) {
            case Format.JSON:
                return parseJsonContent(content);
            case Format.YAML:
                return parseYamlAsync(content);
            case Format.TOML:
                return parseTomlAsync(content);
            case Format.XML:
                return parseXmlAsync(content);
            case Format.CSV:
                return parseCsvAsync(content);
            case Format.INI:
                return parseIniAsync(content);
            case Format.ENV:
                return parseEnvContent(content);
            case Format.JSONL:
                return parseJsonlContent(content);
            default:
                return content;
        }
    }

    static async stringifyAsync(data: unknown, format: Format): Promise<string> {
        if (data === undefined) return '';
        if (data === null && format !== Format.JSON) return '';

        switch (format) {
            case Format.JSON:
                return stringifyJsonData(data);
            case Format.YAML:
                return stringifyYamlAsync(data);
            case Format.TOML:
                return stringifyTomlAsync(data);
            case Format.XML:
                return stringifyXmlAsync(data);
            case Format.CSV:
                return stringifyCsvAsync(data);
            case Format.INI:
                return stringifyIniAsync(data);
            case Format.ENV:
                return stringifyEnvData(data);
            case Format.JSONL:
                return stringifyJsonlData(data);
            case Format.SQL:
                return typeof data === 'string' ? formatSqlAsync(data) : '';
            case Format.HTML:
                return typeof data === 'string' ? formatHtmlContent(data) : '';
            default:
                if (typeof data === 'string') return data;
                return JSON.stringify(data, null, 2);
        }
    }

    static async convertAsync(data: unknown, targetFormat: Format): Promise<string> {
        return convertDataAsync(data, targetFormat);
    }

    static minify(content: string, format: Format): string {
        if (!content.trim()) return '';

        switch (format) {
            case Format.JSON:
                return minifyJsonContent(content);
            case Format.JSONL:
                return minifyJsonlContent(content);
            case Format.SQL:
                return minifySqlContent(content);
            case Format.XML:
                return minifyXmlContent(content);
            case Format.HTML:
                return minifyHtmlContent(content);
            case Format.ENV:
                return minifyEnvContent(content);
            default:
                return content;
        }
    }
}
