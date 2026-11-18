import { useEffect, useState } from "react";
import { ThemeContext, type Theme } from "./useTheme";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

function readStoredTheme(storageKey: string, fallback: Theme): Theme {
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored === "dark" || stored === "light" || stored === "system") {
            return stored;
        }
    } catch {
        /* ignore storage access issues in restricted contexts */
    }
    return fallback;
}

function getSystemTheme(): "dark" | "light" {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return "light";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "jlens-theme",
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(storageKey, defaultTheme));
    const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() => getSystemTheme());

    const resolvedTheme = theme === "system" ? systemTheme : theme;

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(resolvedTheme);
    }, [resolvedTheme]);

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            setSystemTheme(media.matches ? "dark" : "light");
        };

        media.addEventListener("change", handleChange);
        return () => media.removeEventListener("change", handleChange);
    }, []);

    const setTheme = (newTheme: Theme) => {
        try {
            localStorage.setItem(storageKey, newTheme);
        } catch {
            /* ignore storage write errors */
        }
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
