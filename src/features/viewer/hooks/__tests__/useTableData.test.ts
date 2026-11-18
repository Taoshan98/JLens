import { describe, it, expect } from 'vitest';
import { filterTableRows, normalizeTableData, sortTableRows } from '../useTableData';

describe('useTableData helpers', () => {
    it('unwraps single nested array wrapper objects (such as XML root collections)', () => {
        const wrapped = {
            users: [
                { id: 1, name: 'Ada' },
                { id: 2, name: 'Linus' },
            ],
        };

        const unwrapped = normalizeTableData(wrapped, true);
        expect(unwrapped.columns).toEqual(['id', 'name']);
        expect(unwrapped.rows).toHaveLength(2);

        const rawRoot = normalizeTableData(wrapped, false);
        expect(rawRoot.columns).toEqual(['Key', 'Value', 'Type']);
        expect(rawRoot.rows).toHaveLength(1);
    });

    it('filters rows across object values case-insensitively', () => {
        const rows = [
            { id: 1, role: 'Admin', tags: ['core'] },
            { id: 2, role: 'Viewer', tags: ['readonly'] },
        ];
        const filtered = filterTableRows(rows, ['id', 'role', 'tags'], 'READONLY');
        expect(filtered).toEqual([{ id: 2, role: 'Viewer', tags: ['readonly'] }]);
    });

    it('sorts numbers naturally and keeps null/undefined values at the end', () => {
        const rows = [
            { name: 'item-10', score: 10 },
            { name: 'item-2', score: null },
            { name: 'item-1', score: 2 },
        ];

        const byScoreAsc = sortTableRows(rows, 'score', 'asc');
        expect(byScoreAsc.map((r) => r.score)).toEqual([2, 10, null]);

        const byScoreDesc = sortTableRows(rows, 'score', 'desc');
        expect(byScoreDesc.map((r) => r.score)).toEqual([10, 2, null]);

        const byNameAsc = sortTableRows(rows, 'name', 'asc');
        expect(byNameAsc.map((r) => r.name)).toEqual(['item-1', 'item-2', 'item-10']);
    });
});
