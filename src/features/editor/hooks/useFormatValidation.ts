import { useState, useCallback } from 'react';
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
        detectedFormat: Format.TEXT
    });

    const validate = useCallback((content: string, explicitFormat?: Format) => {
        if (!content.trim()) {
            setValidation({
                isValid: true,
                error: null,
                parsedData: null,
                detectedFormat: Format.TEXT
            });
            return;
        }

        const format = explicitFormat || FormatManager.detect(content);

        try {
            const parsed = FormatManager.parse(content, format);
            setValidation({
                isValid: true,
                error: null,
                parsedData: parsed,
                detectedFormat: format
            });
        } catch (err) {
            setValidation({
                isValid: false,
                error: err instanceof Error ? err.message : `Invalid ${format}`,
                parsedData: null,
                detectedFormat: format
            });
        }
    }, []);

    return { validation, validate };
};
