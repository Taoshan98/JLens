import { describe, it, expect } from 'vitest';
import { Format } from '../../../../types/formats';
import {
    getHistoryBytes,
    popHistoryEntry,
    pushHistoryEntry,
    type HistoryEntry,
} from '../useEditorHistory';

describe('useEditorHistory pure stack helpers', () => {
    it('pushes up to maxEntries and pops in LIFO order', () => {
        let stack: HistoryEntry[] = [];
        stack = pushHistoryEntry(stack, { content: 'a', format: Format.TEXT }, 2, 1024);
        stack = pushHistoryEntry(stack, { content: 'b', format: Format.JSON }, 2, 1024);
        stack = pushHistoryEntry(stack, { content: 'c', format: Format.YAML }, 2, 1024);

        expect(stack.map((e) => e.content)).toEqual(['b', 'c']);

        const firstPop = popHistoryEntry(stack);
        expect(firstPop.restored).toEqual({ content: 'c', format: Format.YAML });
        expect(firstPop.remaining).toEqual([{ content: 'b', format: Format.JSON }]);
    });

    it('evicts oldest snapshots when exceeding total byte budget while keeping the latest entry', () => {
        const oneMbChars = 'x'.repeat(512 * 1024); // ~1 MB UTF-16
        let stack: HistoryEntry[] = [];

        stack = pushHistoryEntry(stack, { content: `${oneMbChars}1`, format: undefined }, 25, 3 * 1024 * 1024);
        stack = pushHistoryEntry(stack, { content: `${oneMbChars}2`, format: undefined }, 25, 3 * 1024 * 1024);
        stack = pushHistoryEntry(stack, { content: `${oneMbChars}3`, format: undefined }, 25, 3 * 1024 * 1024);
        expect(stack).toHaveLength(2);
        expect(getHistoryBytes(stack)).toBeLessThanOrEqual(3 * 1024 * 1024);
        expect(stack.map((e) => e.content.slice(-1))).toEqual(['2', '3']);
    });
});
