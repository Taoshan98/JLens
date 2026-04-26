import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Check, AlertCircle } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Editor } from '../../editor/components/Editor';

SyntaxHighlighter.registerLanguage('json', json);

export const JwtTool: React.FC = () => {
    const [token, setToken] = useState('');
    const [decodedHeader, setDecodedHeader] = useState<string | null>(null);
    const [decodedPayload, setDecodedPayload] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token.trim()) {
            setDecodedHeader(null);
            setDecodedPayload(null);
            setError(null);
            return;
        }

        try {
            const header = jwtDecode(token, { header: true });
            const payload = jwtDecode(token);

            setDecodedHeader(JSON.stringify(header, null, 2));
            setDecodedPayload(JSON.stringify(payload, null, 2));
            setError(null);
        } catch (e) {
            setDecodedHeader(null);
            setDecodedPayload(null);
            setError("Invalid Token");
        }
    }, [token]);

    return (
        <div className="flex flex-col h-full gap-4 p-2 overflow-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    JWT Debugger
                </h2>
                <div className="relative h-40">
                    <Editor
                        value={token}
                        onChange={setToken}
                    />
                    {error && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-destructive bg-background/80 px-2 py-1 rounded z-20">
                            <AlertCircle size={12} /> {error}
                        </div>
                    )}
                    {!error && token && (
                        <div className="absolute bottom-3 right-20 flex items-center gap-1 text-xs text-green-500 bg-background/80 px-2 py-1 rounded z-20">
                            <Check size={12} /> Valid Format
                        </div>
                    )}
                </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {/* Header */}
                <div className="flex flex-col gap-2 min-h-0">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Header</label>
                    <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden">
                        <SyntaxHighlighter
                            language="json"
                            style={vs2015}
                            customStyle={{ margin: 0, height: '100%', fontSize: '0.85rem', backgroundColor: 'transparent' }}
                            wrapLongLines={true}
                        >
                            {decodedHeader || '// Header will appear here'}
                        </SyntaxHighlighter>
                    </div>
                </div>

                {/* Payload */}
                <div className="flex flex-col gap-2 min-h-0">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Payload</label>
                    <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden">
                        <SyntaxHighlighter
                            language="json"
                            style={vs2015}
                            customStyle={{ margin: 0, height: '100%', fontSize: '0.85rem', backgroundColor: 'transparent' }}
                            wrapLongLines={true}
                        >
                            {decodedPayload || '// Payload will appear here'}
                        </SyntaxHighlighter>
                    </div>
                </div>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-4">
                Tokens are decoded client-side. No data is sent to any server.
            </div>
        </div>
    );
};
