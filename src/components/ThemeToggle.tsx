import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-md transition-colors duration-200 ${theme === "light"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-foreground"
                    : "text-zinc-500 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                    }`}
                aria-label="Light mode"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-md transition-colors duration-200 ${theme === "system"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-foreground"
                    : "text-zinc-500 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                    }`}
                aria-label="System mode"
            >
                <Laptop className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-md transition-colors duration-200 ${theme === "dark"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-foreground"
                    : "text-zinc-500 hover:text-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
                    }`}
                aria-label="Dark mode"
            >
                <Moon className="w-4 h-4" />
            </button>
        </div>
    );
}
