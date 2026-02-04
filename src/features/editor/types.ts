export interface ValidationResult {
    isValid: boolean;
    error: string | null;
    parsedData: unknown | null;
}
