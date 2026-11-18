import React, { useMemo } from 'react';
import Markdown from 'react-markdown';
import DOMPurify from 'dompurify';
import remarkGfm from 'remark-gfm';
import { Format } from '../../../types/formats';
import { useTheme } from '../../../context/useTheme';
import { CodeHighlighter } from './CodeHighlighter';

interface DocumentPreviewProps {
    content: string;
    format: Format;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ content, format }) => {
    const { resolvedTheme } = useTheme();

    const sanitizedHtmlDocument = useMemo(() => {
        if (format !== Format.HTML) return '';
        const sanitizedBody = DOMPurify.sanitize(content);
        const isDark = resolvedTheme === 'dark';
        const bg = isDark ? '#18181b' : '#ffffff';
        const fg = isDark ? '#f4f4f5' : '#18181b';
        const border = isDark ? '#27272a' : '#e4e4e7';
        const link = isDark ? '#38bdf8' : '#0284c7';

        return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body {
    margin: 0;
    padding: 1rem;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    background: ${bg};
    color: ${fg};
    word-wrap: break-word;
  }
  a { color: ${link}; }
  pre, code {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 0.85em;
  }
  pre {
    padding: 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid ${border};
    overflow-x: auto;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th, td {
    border: 1px solid ${border};
    padding: 0.375rem 0.625rem;
    text-align: left;
  }
</style>
</head>
<body>${sanitizedBody}</body>
</html>`;
    }, [content, format, resolvedTheme]);

    if (format === Format.MARKDOWN) {
        return (
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 h-full overflow-auto">
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ className, children, ref, ...props }) {
                            const match = /language-([\w-]+)/.exec(className || '');
                            const codeText = String(children).replace(/\n$/, '');
                            if (match) {
                                return (
                                    <CodeHighlighter
                                        code={codeText}
                                        language={match[1]}
                                    />
                                );
                            }
                            return (
                                <code {...props} className={className} ref={ref as React.Ref<HTMLElement>}>
                                    {children}
                                </code>
                            );
                        },
                    }}
                >
                    {content}
                </Markdown>
            </div>
        );
    }

    if (format === Format.HTML) {
        return (
            <iframe
                sandbox=""
                srcDoc={sanitizedHtmlDocument}
                title="HTML Preview"
                className="w-full h-full border-0 bg-white dark:bg-zinc-900"
            />
        );
    }

    if (format === Format.SQL) {
        return (
            <div className="h-full overflow-auto p-3">
                <CodeHighlighter code={content} language="sql" showLineNumbers />
            </div>
        );
    }

    return (
        <div className="p-4 h-full overflow-auto font-mono text-sm whitespace-pre-wrap">
            {content}
        </div>
    );
};
