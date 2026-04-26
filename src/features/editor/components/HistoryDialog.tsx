import React from 'react';
import type { HistoryItem } from '../hooks/useSessionHistory';
import { X, Clock, Trash2 } from 'lucide-react';

interface HistoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onRestore: (content: string) => void;
    onClear: () => void;
}

export const HistoryDialog: React.FC<HistoryDialogProps> = ({ isOpen, onClose, history, onRestore, onClear }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Clock size={18} /> Session History
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {history.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 text-sm">
                            No history yet.
                        </div>
                    ) : (
                        history.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onRestore(item.content);
                                    onClose();
                                }}
                                className="w-full text-left p-3 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-all group"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                                        {item.format}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono line-clamp-2 break-all">
                                    {item.preview}
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {history.length > 0 && (
                    <div className="p-4 border-t border-border bg-muted/20">
                        <button
                            onClick={onClear}
                            className="w-full flex items-center justify-center gap-2 text-xs text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"
                        >
                            <Trash2 size={14} /> Clear History
                        </button>
                    </div>
                )}
            </div>
            <div className="absolute inset-0 -z-10" onClick={onClose}></div>
        </div>
    );
};
