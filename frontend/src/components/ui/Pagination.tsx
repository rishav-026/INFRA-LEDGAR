import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border
                   hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronLeft size={16} /> Prev
      </button>

      <span className="text-sm text-text-secondary px-3">
        Page {page} of {totalPages}
      </span>

      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border
                   hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}
