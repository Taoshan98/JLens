import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

interface DataTableViewProps {
    data: unknown;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
    column: string | null;
    direction: SortDirection;
}

const PAGE_SIZE = 100;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function compareValues(a: unknown, b: unknown): number {
    if (a === b) return 0;
    if (a === undefined || a === null) return 1;
    if (b === undefined || b === null) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    const strA = typeof a === 'object' ? JSON.stringify(a) : String(a);
    const strB = typeof b === 'object' ? JSON.stringify(b) : String(b);
    return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
}

export const DataTableView: React.FC<DataTableViewProps> = ({ data }) => {
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState<SortState>({ column: null, direction: null });
    const [pageState, setPageState] = useState<{
        dataRef: unknown;
        filter: string;
        page: number;
    }>({
        dataRef: data,
        filter: '',
        page: 0,
    });
    const [unwrapArrayKey, setUnwrapArrayKey] = useState(true);

    const candidateArrayEntry = useMemo(() => {
        if (!isPlainObject(data)) return null;
        const keys = Object.keys(data);
        if (keys.length === 1 && Array.isArray(data[keys[0]]) && (data[keys[0]] as unknown[]).length > 0) {
            return { key: keys[0], rows: data[keys[0]] as unknown[] };
        }
        return null;
    }, [data]);

    const { columns, rows } = useMemo<{
        columns: string[];
        rows: Array<Record<string, unknown>>;
    }>(() => {
        const sourceData =
            candidateArrayEntry && unwrapArrayKey ? candidateArrayEntry.rows : data;

        if (Array.isArray(sourceData)) {
            if (sourceData.length === 0) {
                return { columns: [] as string[], rows: [] as Array<Record<string, unknown>> };
            }

            const hasObjects = sourceData.some((item) => isPlainObject(item));
            if (!hasObjects) {
                return {
                    columns: ['#', 'Value'],
                    rows: sourceData.map((item, idx) => ({ '#': idx, Value: item })),
                };
            }

            const colSet = new Set<string>();
            let hasPrimitiveRows = false;
            for (const item of sourceData) {
                if (isPlainObject(item)) {
                    for (const k of Object.keys(item)) {
                        colSet.add(k);
                    }
                } else {
                    hasPrimitiveRows = true;
                }
            }
            if (hasPrimitiveRows) {
                colSet.add('__value');
            }

            const colList = Array.from(colSet);
            const normalizedRows = sourceData.map((item) => {
                if (isPlainObject(item)) return item;
                return { __value: item };
            });
            return { columns: colList, rows: normalizedRows };
        }

        if (isPlainObject(sourceData)) {
            const entries = Object.entries(sourceData);
            return {
                columns: ['Key', 'Value', 'Type'],
                rows: entries.map(([k, v]) => ({
                    Key: k,
                    Value: v,
                    Type: v === null ? 'null' : Array.isArray(v) ? `array(${v.length})` : typeof v,
                })),
            };
        }

        return { columns: ['Value'], rows: [{ Value: sourceData }] };
    }, [data, candidateArrayEntry, unwrapArrayKey]);

    const filteredRows = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((row) =>
            columns.some((col) => {
                const cell = row[col];
                if (cell === undefined) return false;
                const text =
                    cell === null
                        ? 'null'
                        : typeof cell === 'object'
                        ? JSON.stringify(cell)
                        : String(cell);
                return text.toLowerCase().includes(q);
            })
        );
    }, [rows, columns, filter]);

    const sortedRows = useMemo(() => {
        if (!sort.column || !sort.direction || !columns.includes(sort.column)) {
            return filteredRows;
        }
        const col = sort.column;
        const factor = sort.direction === 'asc' ? 1 : -1;
        return [...filteredRows].sort((a, b) => compareValues(a[col], b[col]) * factor);
    }, [filteredRows, sort, columns]);

    const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
    const currentPage =
        pageState.dataRef === data && pageState.filter === filter
            ? Math.min(pageState.page, totalPages - 1)
            : 0;

    const visibleRows = useMemo(() => {
        const start = currentPage * PAGE_SIZE;
        return sortedRows.slice(start, start + PAGE_SIZE);
    }, [sortedRows, currentPage]);

    const handleSortClick = (col: string) => {
        setSort((prev) => {
            if (prev.column !== col) return { column: col, direction: 'asc' };
            if (prev.direction === 'asc') return { column: col, direction: 'desc' };
            return { column: null, direction: null };
        });
    };

    const handleCopyCell = async (value: unknown) => {
        if (value === undefined) return;
        const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            /* ignore clipboard errors */
        }
    };

    if (rows.length === 0) {
        return (
            <div className="h-full flex items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
                Empty dataset
            </div>
        );
    }

    const startRow = currentPage * PAGE_SIZE + 1;
    const endRow = Math.min((currentPage + 1) * PAGE_SIZE, sortedRows.length);

    return (
        <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-2 border-b border-border bg-muted/10 shrink-0">
                <div className="relative flex-1 min-w-[160px]">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => {
                            setFilter(e.target.value);
                            setPageState({ dataRef: data, filter: e.target.value, page: 0 });
                        }}
                        placeholder="Filter table rows..."
                        aria-label="Filter table rows"
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-muted/20 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    {filter && (
                        <button
                            type="button"
                            onClick={() => {
                                setFilter('');
                                setPageState({ dataRef: data, filter: '', page: 0 });
                            }}
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
                        onClick={() => setUnwrapArrayKey((prev) => !prev)}
                        className="px-2 py-1 text-xs rounded border border-border bg-muted/20 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {unwrapArrayKey ? `Unwrapped: ${candidateArrayEntry.key}` : 'Show root object'}
                    </button>
                )}

                <span className="text-[11px] text-muted-foreground font-mono">
                    {sortedRows.length} {sortedRows.length === 1 ? 'row' : 'rows'}
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
                                            onClick={() => handleSortClick(col)}
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
                                            onClick={() => handleCopyCell(row[col])}
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

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/10 text-xs text-muted-foreground shrink-0">
                    <span>
                        Rows {startRow}–{endRow} of {sortedRows.length}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            disabled={currentPage === 0}
                            onClick={() =>
                                setPageState({ dataRef: data, filter, page: Math.max(0, currentPage - 1) })
                            }
                            aria-label="Previous page"
                            className="p-1 rounded border border-border hover:bg-accent disabled:opacity-30"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        <span className="px-2 font-mono">
                            {currentPage + 1} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage >= totalPages - 1}
                            onClick={() =>
                                setPageState({
                                    dataRef: data,
                                    filter,
                                    page: Math.min(totalPages - 1, currentPage + 1),
                                })
                            }
                            aria-label="Next page"
                            className="p-1 rounded border border-border hover:bg-accent disabled:opacity-30"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
