import React, { useState } from 'react';
import { X, Globe, Download, AlertCircle } from 'lucide-react';

interface ImportUrlDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (content: string) => void;
}

export const ImportUrlDialog: React.FC<ImportUrlDialogProps> = ({ isOpen, onClose, onImport }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetch = async () => {
        if (!url) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            const text = await res.text();
            onImport(text);
            onClose();
        } catch (e: any) {
            setError(e.message || "Fetch failed. Ensure CORS is enabled on the server or use a proxy.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Globe size={18} /> Import from URL
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-muted-foreground">URL</label>
                        <input
                            type="url"
                            className="w-full p-2 bg-card border border-border rounded-md text-sm outline-none focus:border-primary"
                            placeholder="https://api.example.com/data.json"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-xs">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold mb-1">Error</p>
                                <p>{error}</p>
                                <p className="mt-2 text-[10px] opacity-80">
                                    Note: This is a client-side fetch. The target server must support CORS (Access-Control-Allow-Origin: *).
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={onClose} className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleFetch}
                            disabled={loading || !url}
                            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'Fetching...' : <><Download size={14} /> Fetch</>}
                        </button>
                    </div>
                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={onClose}></div>
        </div>
    );
};
