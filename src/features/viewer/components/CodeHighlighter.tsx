import React from 'react';
import PrismLight from 'react-syntax-highlighter/dist/esm/prism-light';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import toml from 'react-syntax-highlighter/dist/esm/languages/prism/toml';
import ini from 'react-syntax-highlighter/dist/esm/languages/prism/ini';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import { useTheme } from '../../../context/useTheme';

PrismLight.registerLanguage('json', json);
PrismLight.registerLanguage('yaml', yaml);
PrismLight.registerLanguage('sql', sql);
PrismLight.registerLanguage('bash', bash);
PrismLight.registerLanguage('javascript', javascript);
PrismLight.registerLanguage('typescript', typescript);
PrismLight.registerLanguage('markup', markup);
PrismLight.registerLanguage('markdown', markdown);
PrismLight.registerLanguage('toml', toml);
PrismLight.registerLanguage('ini', ini);
PrismLight.registerLanguage('css', css);
PrismLight.registerLanguage('python', python);

PrismLight.alias('markup', ['html', 'xml', 'svg']);
PrismLight.alias('typescript', ['ts', 'tsx']);
PrismLight.alias('javascript', ['js', 'jsx']);
PrismLight.alias('bash', ['sh', 'shell', 'zsh']);
PrismLight.alias('yaml', ['yml']);
PrismLight.alias('markdown', ['md']);

interface CodeHighlighterProps {
    code: string;
    language: string;
    showLineNumbers?: boolean;
}

export const CodeHighlighter: React.FC<CodeHighlighterProps> = ({
    code,
    language,
    showLineNumbers = false,
}) => {
    const { resolvedTheme } = useTheme();
    const style = resolvedTheme === 'dark' ? vscDarkPlus : oneLight;

    return (
        <PrismLight
            style={style}
            language={language}
            PreTag="div"
            showLineNumbers={showLineNumbers}
            customStyle={{
                margin: 0,
                background: 'transparent',
                fontSize: '0.8125rem',
                lineHeight: '1.5',
            }}
        >
            {code}
        </PrismLight>
    );
};
