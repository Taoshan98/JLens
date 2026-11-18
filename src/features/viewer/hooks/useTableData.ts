import { useMemo, useState } from 'react';
import { isPlainObject } from '../../../utils/guards';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
    column: string | null;
    direction: SortDirection;
}

export interface NormalizedTable {
    columns: string[];
    rows: Array<Record<string, unknown>>;
}

export const TABLE_PAGE_SIZE = 100;

const naturalCollator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
});

export function getCandidateArrayEntry(
    data: unknown
): { key: string; rows: unknown[] } | null {
    if (!isPlainObject(data)) return null;
    const keys = Object.keys(data);
    if (
        keys.length === 1 &&
        Array.isArray(data[keys[0]]) &&
        (data[keys[0]] as unknown[]).length > 0
    ) {
        return { key: keys[0], rows: data[keys[0]] as unknown[] };
    }
    return null;
}

export function normalizeTableData(
    data: unknown,
    unwrapArray: boolean
): NormalizedTable {
    const candidate = getCandidateArrayEntry(data);
    const sourceData = candidate && unwrapArray ? candidate.rows : data;

    if (Array.isArray(sourceData)) {
        if (sourceData.length === 0) {
            return { columns: [], rows: [] };
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

        const columns = Array.from(colSet);
        const rows = sourceData.map((item) =>
            isPlainObject(item) ? item : { __value: item }
        );
        return { columns, rows };
    }

    if (isPlainObject(sourceData)) {
        const entries = Object.entries(sourceData);
        return {
            columns: ['Key', 'Value', 'Type'],
            rows: entries.map(([k, v]) => ({
                Key: k,
                Value: v,
                Type:
                    v === null
                        ? 'null'
                        : Array.isArray(v)
                        ? `array(${v.length})`
                        : typeof v,
            })),
        };
    }

    return { columns: ['Value'], rows: [{ Value: sourceData }] };
}

export function filterTableRows(
    rows: Array<Record<string, unknown>>,
    columns: string[],
    filterQuery: string
): Array<Record<string, unknown>> {
    const q = filterQuery.trim().toLowerCase();
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
}

interface SortDecoratedRow {
    row: Record<string, unknown>;
    isEmpty: boolean;
    numVal: number | null;
    boolVal: number | null;
    strVal: string;
}

export function sortTableRows(
    rows: Array<Record<string, unknown>>,
    column: string,
    direction: Exclude<SortDirection, null>
): Array<Record<string, unknown>> {
    const factor = direction === 'asc' ? 1 : -1;

    // Schwartzian transform: extract comparable keys once in O(N) instead of inside O(N log N) comparator
    const decorated: SortDecoratedRow[] = rows.map((row) => {
        const val = row[column];
        if (val === undefined || val === null) {
            return { row, isEmpty: true, numVal: null, boolVal: null, strVal: '' };
        }
        if (typeof val === 'number' && !Number.isNaN(val)) {
            return { row, isEmpty: false, numVal: val, boolVal: null, strVal: '' };
        }
        if (typeof val === 'boolean') {
            return { row, isEmpty: false, numVal: null, boolVal: val ? 1 : 0, strVal: '' };
        }
        const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return { row, isEmpty: false, numVal: null, boolVal: null, strVal };
    });

    decorated.sort((a, b) => {
        if (a.isEmpty && b.isEmpty) return 0;
        if (a.isEmpty) return 1;
        if (b.isEmpty) return -1;

        if (a.numVal !== null && b.numVal !== null) {
            return (a.numVal - b.numVal) * factor;
        }
        if (a.boolVal !== null && b.boolVal !== null) {
            return (a.boolVal - b.boolVal) * factor;
        }
        const strA = a.numVal !== null ? String(a.numVal) : a.boolVal !== null ? String(Boolean(a.boolVal)) : a.strVal;
        const strB = b.numVal !== null ? String(b.numVal) : b.boolVal !== null ? String(Boolean(b.boolVal)) : b.strVal;
        return naturalCollator.compare(strA, strB) * factor;
    });

    return decorated.map((item) => item.row);
}

export function useTableData(data: unknown) {
    const [filter, setFilter] = useState('');
    const [sort, setSort] = useState<SortState>({ column: null, direction: null });
    const [unwrapArrayKey, setUnwrapArrayKey] = useState(true);
    const [pageState, setPageState] = useState<{
        dataRef: unknown;
        filter: string;
        page: number;
    }>({
        dataRef: data,
        filter: '',
        page: 0,
    });

    const candidateArrayEntry = useMemo(() => getCandidateArrayEntry(data), [data]);

    const { columns, rows } = useMemo(
        () => normalizeTableData(data, unwrapArrayKey),
        [data, unwrapArrayKey]
    );

    const filteredRows = useMemo(
        () => filterTableRows(rows, columns, filter),
        [rows, columns, filter]
    );

    const sortedRows = useMemo(() => {
        if (!sort.column || !sort.direction || !columns.includes(sort.column)) {
            return filteredRows;
        }
        return sortTableRows(filteredRows, sort.column, sort.direction);
    }, [filteredRows, sort, columns]);

    const totalPages = Math.max(1, Math.ceil(sortedRows.length / TABLE_PAGE_SIZE));
    const currentPage =
        pageState.dataRef === data && pageState.filter === filter
            ? Math.min(pageState.page, totalPages - 1)
            : 0;

    const visibleRows = useMemo(() => {
        const start = currentPage * TABLE_PAGE_SIZE;
        return sortedRows.slice(start, start + TABLE_PAGE_SIZE);
    }, [sortedRows, currentPage]);

    const updateFilter = (nextFilter: string) => {
        setFilter(nextFilter);
        setPageState({ dataRef: data, filter: nextFilter, page: 0 });
    };

    const setPage = (nextPage: number) => {
        setPageState({
            dataRef: data,
            filter,
            page: Math.max(0, Math.min(totalPages - 1, nextPage)),
        });
    };

    const toggleSort = (col: string) => {
        setSort((prev) => {
            if (prev.column !== col) return { column: col, direction: 'asc' };
            if (prev.direction === 'asc') return { column: col, direction: 'desc' };
            return { column: null, direction: null };
        });
    };

    return {
        filter,
        updateFilter,
        sort,
        toggleSort,
        candidateArrayEntry,
        unwrapArrayKey,
        toggleUnwrap: () => setUnwrapArrayKey((prev) => !prev),
        columns,
        totalRows: sortedRows.length,
        visibleRows,
        currentPage,
        totalPages,
        setPage,
    };
}
