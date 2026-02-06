import React, { useMemo } from 'react';
import Markdown from 'react-markdown';
import DOMPurify from 'dompurify';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Format } from '../../../types/formats';

interface DocumentPreviewProps {
    content: string;
    format: Format;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ content, format }) => {

    // Sanitize HTML
    const sanitizedHtml = useMemo(() => {
        if (format !== Format.HTML) return '';
        return DOMPurify.sanitize(content);
    }, [content, format]);

    if (format === Format.MARKDOWN) {
        return (
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 h-full overflow-auto">
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        code({ node, className, children, style, ref, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                                <SyntaxHighlighter
                                    {...props}
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code {...props} className={className} ref={ref as React.Ref<HTMLElement>}>
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {content}
                </Markdown>
            </div>
        );
    }

    if (format === Format.HTML) {
        return (
            <div
                className="prose prose-sm dark:prose-invert max-w-none p-4 h-full overflow-auto bg-white dark:bg-zinc-900"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
        );
    }

    return (
        <div className="p-4 h-full overflow-auto font-mono text-sm whitespace-pre-wrap">
            {content}
        </div>
    );
};
