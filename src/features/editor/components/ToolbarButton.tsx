import React from 'react';

interface ToolbarButtonProps {
    onClick: () => void;
    disabled?: boolean;
    title: string;
    ariaLabel?: string;
    icon: React.ReactNode;
    label?: string;
    labelClassName?: string;
    tone?: 'default' | 'accent' | 'success' | 'danger';
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = React.memo(
    ({
        onClick,
        disabled = false,
        title,
        ariaLabel,
        icon,
        label,
        labelClassName = 'hidden sm:inline',
        tone = 'default',
    }) => {
        const base =
            'inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors duration-150';

        let toneClasses: string;
        if (disabled) {
            toneClasses = 'text-muted-foreground/40 cursor-not-allowed';
        } else if (tone === 'danger') {
            toneClasses =
                'text-destructive/70 hover:text-destructive hover:bg-destructive/10 active:scale-[0.98]';
        } else if (tone === 'accent') {
            toneClasses =
                'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10';
        } else if (tone === 'success') {
            toneClasses =
                'text-green-600 dark:text-green-400 hover:bg-accent active:scale-[0.98]';
        } else {
            toneClasses =
                'text-foreground/80 hover:text-foreground hover:bg-accent active:scale-[0.98]';
        }

        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                title={title}
                aria-label={ariaLabel ?? title}
                className={`${base} ${toneClasses}`}
            >
                {icon}
                {label && <span className={labelClassName}>{label}</span>}
            </button>
        );
    }
);

ToolbarButton.displayName = 'ToolbarButton';
