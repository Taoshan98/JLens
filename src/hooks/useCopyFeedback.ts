import { useCallback, useEffect, useRef, useState } from 'react';

export function useCopyFeedback<K extends string = 'default'>(durationMs = 1500) {
    const [copiedKey, setCopiedKey] = useState<K | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    const copyText = useCallback(
        async (text: string, key: K = 'default' as K): Promise<boolean> => {
            try {
                await navigator.clipboard.writeText(text);
                if (timerRef.current !== null) {
                    clearTimeout(timerRef.current);
                }
                setCopiedKey(key);
                timerRef.current = setTimeout(() => {
                    setCopiedKey(null);
                    timerRef.current = null;
                }, durationMs);
                return true;
            } catch {
                return false;
            }
        },
        [durationMs]
    );

    return { copiedKey, copyText };
}
