import { useState } from 'react';
import { Search } from 'lucide-react';
import type { ProjectStatus } from '../../types';

interface FilterBarProps {
  onSearch: (query: string) => void;
  onStatusFilter: (status: ProjectStatus | 'all') => void;
  currentStatus: ProjectStatus | 'all';
}

export function FilterBar({ onSearch, onStatusFilter, currentStatus }: FilterBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    // debounce
    const id = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(id);
  };

  const statuses: { value: ProjectStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'flagged', label: 'Flagged' },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search by name or location..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface
                     placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-surface rounded-lg border border-border p-1">
        {statuses.map((s) => (
          <button
            key={s.value}
            onClick={() => onStatusFilter(s.value)}
            className={`
              px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer
              ${currentStatus === s.value
                ? 'bg-brand-600 text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'}
            `}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
