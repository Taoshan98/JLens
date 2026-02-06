import React from 'react';
import { Format, FORMATS } from '../../../types/formats';
import { ChevronDown } from 'lucide-react';

interface FormatSelectorProps {
    value: Format | undefined;
    onChange: (format: Format) => void;
    detectedFormat: Format;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({ value, onChange, detectedFormat }) => {
    return (
        <div className="relative group">
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value as Format)}
                className="appearance-none bg-transparent dark:bg-zinc-900 pl-2 pr-8 py-1 text-xs font-medium text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer uppercase tracking-wide rounded-sm"
            >
                <option value="">Auto ({FORMATS[detectedFormat]?.name || 'Text'})</option>
                {Object.values(FORMATS).map((f) => (
                    <option key={f.id} value={f.id}>
                        {f.name}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>
    );
};
