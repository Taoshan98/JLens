import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    startRow: number;
    endRow: number;
    totalRows: number;
    onPageChange: (page: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = React.memo(
    ({ currentPage, totalPages, startRow, endRow, totalRows, onPageChange }) => {
        if (totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/10 text-xs text-muted-foreground shrink-0">
                <span>
                    Rows {startRow}–{endRow} of {totalRows}
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        disabled={currentPage === 0}
                        onClick={() => onPageChange(currentPage - 1)}
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
                        onClick={() => onPageChange(currentPage + 1)}
                        aria-label="Next page"
                        className="p-1 rounded border border-border hover:bg-accent disabled:opacity-30"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        );
    }
);

TablePagination.displayName = 'TablePagination';
