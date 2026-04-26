import React, { useState, useMemo } from 'react';
import Split from 'react-split';
import { diffLines } from 'diff';
import { Editor } from '../../editor/components/Editor';

export const DiffTool: React.FC = () => {
    const [leftInput, setLeftInput] = useState('');
    const [rightInput, setRightInput] = useState('');

    const changes = useMemo(() => {
        return diffLines(leftInput, rightInput);
    }, [leftInput, rightInput]);

    return (
        <div className="flex flex-col h-full gap-4 p-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex gap-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        Diff Checker
                    </h2>
                </div>
                <div className="flex gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/20 border border-red-500/50 rounded-sm"></span> Removed</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500/20 border border-green-500/50 rounded-sm"></span> Added</span>
                </div>
            </div>

            <Split
                className="flex flex-1 min-h-0"
                sizes={[35, 35, 30]}
                gutterSize={8}
                gutterAlign="center"
                snapOffset={30}
                dragInterval={1}
                direction="horizontal"
                cursor="col-resize"
            >
                {/* Left Input */}
                <div className="h-full flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Original</label>
                    <div className="flex-1 min-h-0">
                        <Editor
                            value={leftInput}
                            onChange={setLeftInput}
                        />
                    </div>
                </div>

                {/* Right Input */}
                <div className="h-full flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Modified</label>
                    <div className="flex-1 min-h-0">
                        <Editor
                            value={rightInput}
                            onChange={setRightInput}
                        />
                    </div>
                </div>

                {/* Diff View */}
                <div className="h-full flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Result</label>
                    <div className="flex-1 w-full overflow-auto p-3 bg-card border border-border rounded-lg font-mono text-xs whitespace-pre">
                        {changes.map((part, index) => {
                            const colorClass = part.added
                                ? 'bg-green-500/20 text-green-700 dark:text-green-400 block w-full'
                                : part.removed
                                    ? 'bg-red-500/20 text-red-700 dark:text-red-400 block w-full'
                                    : 'text-muted-foreground';

                            const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';

                            // Split lines to ensure block display works per line
                            return part.value.split('\n').filter((l, i, a) => !(i === a.length - 1 && l === '')).map((line, lineIdx) => (
                                <div key={`${index}-${lineIdx}`} className={`${colorClass} px-1`}>
                                    <span className="select-none opacity-50 mr-2 w-2 inline-block text-right">{prefix}</span>
                                    {line}
                                </div>
                            ));
                        })}
                        {leftInput === '' && rightInput === '' && (
                            <div className="text-muted-foreground/50 text-center mt-10 italic">
                                Paste content in both panels to see differences
                            </div>
                        )}
                    </div>
                </div>
            </Split>
        </div>
    );
};
