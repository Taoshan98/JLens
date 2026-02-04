import { useState, useCallback } from 'react';
import type { ValidationResult } from '../types';

export const useJsonValidation = () => {
    const [validation, setValidation] = useState<ValidationResult>({
        isValid: true,
        error: null,
        parsedData: null,
    });

    const validate = useCallback((jsonString: string) => {
        if (!jsonString.trim()) {
            setValidation({
                isValid: true,
                error: null,
                parsedData: null,
            });
            return;
        }

        try {
            const parsed = JSON.parse(jsonString);
            setValidation({
                isValid: true,
                error: null,
                parsedData: parsed,
            });
        } catch (err) {
            setValidation({
                isValid: false,
                error: err instanceof Error ? err.message : 'Invalid JSON',
                parsedData: null,
            });
        }
    }, []);

    return { validation, validate };
};
