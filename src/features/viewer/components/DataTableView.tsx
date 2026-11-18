import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from 'lucide-react';
import { TABLE_PAGE_SIZE, useTableData } from '../hooks/useTableData';
import { TablePagination } from './TablePagination';

interface DataTableViewProps {
    data: unknown;
}

function formatCellValue(value: unknown): { text: string; title: string; className: string } {
    if (value === undefined) {
        return { text: '—', title: 'undefined', className: 'text-muted-foreground/50' };
    }
    if (value === null) {
        return { text: 'null', title: 'null', className: 'text-muted-foreground italic' };
    }
    if (typeof value === 'string') {
        return { text: value, title: value, className: 'text-emerald-600 dark:text-emerald-400' };
    }
    if (typeof value === 'number') {
        return { text: String(value), title: String(value), className: 'text-amber-600 dark:text-amber-400' };
    }
    if (typeof value === 'boolean') {
        return { text: String(value), title: String(value), className: 'text-rose-600 dark:text-rose-400' };
    }
    const serialized = JSON.stringify(value);
    const preview = Array.isArray(value)
        ? `Array(${value.length})`
        : `Object { ${Object.keys(value as object).length} }`;
    return { text: preview, title: serialized, className: 'text-sky-600 dark:text-sky-400' };
}

export const DataTableView: React.FC<DataTableViewProps> = ({ data }) => {
    const {
        filter,
        updateFilter,
        sort,
        toggleSort,
        candidateArrayEntry,
        unwrapArrayKey,
        toggleUnwrap,
        columns,
        totalRows,
        visibleRows,
        currentPage,
        totalPages,
        setPage,
    } = useTableData(data);

    const handleCopyCell = async (value: unknown) => {
        if (value === undefined) return;
        const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            /* ignore clipboard errors */
        }
    };

    if (totalRows === 0 && !filter) {
        return (
            <div className="h-full flex items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
                Empty dataset
            </div>
        );
    }

    const startRow = currentPage * TABLE_PAGE_SIZE + 1;
    const endRow = Math.min((currentPage + 1) * TABLE_PAGE_SIZE, totalRows);

    return (
        <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-2 border-b border-border bg-muted/10 shrink-0">
                <div className="relative flex-1 min-w-[160px]">
                    <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60"
                    />
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => updateFilter(e.target.value)}
                        placeholder="Filter table rows..."
                        aria-label="Filter table rows"
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-muted/20 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    {filter && (
                        <button
                            type="button"
                            onClick={() => updateFilter('')}
                            aria-label="Clear table filter"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {candidateArrayEntry && (
                    <button
                        type="button"
                        onClick={toggleUnwrap}
                        className="px-2 py-1 text-xs rounded border border-border bg-muted/20 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {unwrapArrayKey ? `Unwrapped: ${candidateArrayEntry.key}` : 'Show root object'}
                    </button>
                )}

                <span className="text-[11px] text-muted-foreground font-mono">
                    {totalRows} {totalRows === 1 ? 'row' : 'rows'}
                </span>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm border-b border-border">
                        <tr>
                            {columns.map((col) => {
                                const isSorted = sort.column === col;
                                return (
                                    <th key={col} className="p-0 font-medium text-muted-foreground whitespace-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => toggleSort(col)}
                                            className="w-full flex items-center gap-1.5 px-3 py-2 text-left hover:text-foreground hover:bg-accent/50 transition-colors"
                                        >
                                            <span>{col}</span>
                                            {isSorted && sort.direction === 'asc' ? (
                                                <ArrowUp size={12} className="text-foreground shrink-0" />
                                            ) : isSorted && sort.direction === 'desc' ? (
                                                <ArrowDown size={12} className="text-foreground shrink-0" />
                                            ) : (
                                                <ArrowUpDown size={12} className="opacity-30 shrink-0" />
                                            )}
                                        </button>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {visibleRows.map((row, idx) => (
                            <tr key={startRow + idx} className="hover:bg-muted/15 transition-colors">
                                {columns.map((col) => {
                                    const formatted = formatCellValue(row[col]);
                                    return (
                                        <td
                                            key={col}
                                            title={`${formatted.title} (click to copy)`}
                                            onClick={() => void handleCopyCell(row[col])}
                                            className={`px-3 py-2 max-w-[260px] truncate cursor-pointer ${formatted.className}`}
                                        >
                                            {formatted.text}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {visibleRows.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="p-6 text-center text-muted-foreground">
                                    No matching rows
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                startRow={startRow}
                endRow={endRow}
                totalRows={totalRows}
                onPageChange={setPage}
            />
        </div>
    );
};
