'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { Button } from './Button';
import { motion, AnimatePresence } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border-t border-neutral-200 text-xs text-neutral-600">
      {/* Showing count */}
      <div className="flex items-center gap-3">
        <span>
          Showing <b className="text-neutral-900 font-mono">{startItem}</b> to{' '}
          <b className="text-neutral-900 font-mono">{endItem}</b> of{' '}
          <b className="text-neutral-900 font-mono">{totalItems}</b> items
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-neutral-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-gold-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p, idx) => (
          typeof p === 'number' ? (
            <button
              key={idx}
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                currentPage === p
                  ? 'bg-gold-500 text-white shadow-xs'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-neutral-400 font-mono">
              {p}
            </span>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isDeleting?: boolean;
  entityName?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  isDeleting = false,
  entityName = 'items',
}) => {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="p-3 rounded-2xl bg-neutral-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-md border border-neutral-800 text-xs"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-gold-500 text-neutral-950 font-bold font-mono text-[11px] flex items-center justify-center">
            {selectedCount}
          </span>
          <span className="font-bold">
            {selectedCount} {selectedCount === 1 ? entityName.replace(/s$/, '') : entityName} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-neutral-400 hover:text-white text-[11px] underline ml-1 cursor-pointer"
          >
            Deselect All
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="danger"
            size="sm"
            onClick={onBulkDelete}
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            className="text-xs font-bold shadow-xs py-1"
          >
            Delete Selected ({selectedCount})
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
