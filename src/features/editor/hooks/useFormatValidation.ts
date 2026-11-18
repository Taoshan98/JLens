import { useState, useCallback, useRef } from 'react';
import { FormatManager } from '../../../utils/formatManager';
import { Format } from '../../../types/formats';

interface ValidationState {
    isValid: boolean;
    error: string | null;
    parsedData: unknown | null;
    detectedFormat: Format;
}

export const useFormatValidation = () => {
    const [validation, setValidation] = useState<ValidationState>({
        isValid: true,
        error: null,
        parsedData: null,
        detectedFormat: Format.TEXT,
    });
    const requestIdRef = useRef(0);

    const validate = useCallback(async (content: string, explicitFormat?: Format) => {
        const reqId = ++requestIdRef.current;

        if (!content.trim()) {
            setValidation({
                isValid: true,
                error: null,
                parsedData: null,
                detectedFormat: explicitFormat ?? Format.TEXT,
            });
            return;
        }

        const format = explicitFormat || FormatManager.detect(content);

        try {
            const parsed = await FormatManager.parseAsync(content, format);
            if (requestIdRef.current !== reqId) return;

            setValidation({
                isValid: true,
                error: null,
                parsedData: parsed,
                detectedFormat: format,
            });
        } catch (err) {
            if (requestIdRef.current !== reqId) return;

            setValidation({
                isValid: false,
                error: err instanceof Error ? err.message : `Invalid ${format}`,
                parsedData: null,
                detectedFormat: format,
            });
        }
    }, []);

    return { validation, validate };
};
