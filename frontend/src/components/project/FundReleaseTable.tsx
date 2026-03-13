import { useMemo, useState } from 'react';
import type { Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDate, truncateHash } from '../../utils/format';
import { POLYGONSCAN_BASE } from '../../constants';
import { ArrowUpDown, ExternalLink, Search } from 'lucide-react';

interface FundReleaseTableProps {
  transactions: Transaction[];
}

export function FundReleaseTable({ transactions }: FundReleaseTableProps) {
  const [sortBy, setSortBy] = useState<'releaseDate' | 'amount'>('releaseDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [query, setQuery] = useState('');

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = transactions.filter((tx) => {
      if (!q) return true;
      return (
        tx.purpose.toLowerCase().includes(q) ||
        tx.status.toLowerCase().includes(q) ||
        tx.blockchainTxHash.toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const order = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'amount') return (a.amount - b.amount) * order;
      return (new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()) * order;
    });
  }, [transactions, query, sortBy, sortDir]);

  const columns = [
    { key: 'date', header: 'Date', render: (tx: Transaction) => <span className="whitespace-nowrap">{formatDate(tx.releaseDate)}</span> },
    { key: 'amount', header: 'Amount', render: (tx: Transaction) => <span className="font-medium">{formatCurrency(tx.amount)}</span> },
    { key: 'purpose', header: 'Purpose', render: (tx: Transaction) => <span className="text-text-secondary">{tx.purpose}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (tx: Transaction) => {
        const variant = tx.status === 'confirmed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger';
        return <Badge variant={variant}>{tx.status}</Badge>;
      },
    },
    {
      key: 'txHash',
      header: 'Tx Hash',
      render: (tx: Transaction) => (
        <a
          href={`${POLYGONSCAN_BASE}${tx.blockchainTxHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-brand-600 hover:underline font-mono text-xs"
        >
          {truncateHash(tx.blockchainTxHash)} <ExternalLink size={12} />
        </a>
      ),
    },
  ];

  return (
    <Card
      header={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h3 className="text-sm font-semibold">Fund Releases</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search purpose / status / hash"
                className="h-8 pl-8 pr-2.5 rounded-lg border border-border bg-surface text-xs w-52"
              />
            </div>
            <button
              onClick={() => {
                setSortBy('releaseDate');
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
              }}
              className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-surface-secondary"
            >
              <ArrowUpDown size={13} /> Date
            </button>
            <button
              onClick={() => {
                setSortBy('amount');
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
              }}
              className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg border border-border text-xs text-text-secondary hover:bg-surface-secondary"
            >
              <ArrowUpDown size={13} /> Amount
            </button>
          </div>
        </div>
      }
      padding="none"
    >
      <Table
        columns={columns}
        data={filteredSorted}
        keyExtractor={(tx) => tx.id}
        emptyMessage="No funds released yet."
      />
    </Card>
  );
}
