import type { Transaction } from '../../types';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatDate, truncateHash } from '../../utils/format';
import { POLYGONSCAN_BASE } from '../../constants';
import { ExternalLink } from 'lucide-react';

interface FundReleaseTableProps {
  transactions: Transaction[];
}

export function FundReleaseTable({ transactions }: FundReleaseTableProps) {
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
    <Card header={<h3 className="text-sm font-semibold">Fund Releases</h3>} padding="none">
      <Table
        columns={columns}
        data={transactions}
        keyExtractor={(tx) => tx.id}
        emptyMessage="No funds released yet."
      />
    </Card>
  );
}
