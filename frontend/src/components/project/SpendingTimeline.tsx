import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Transaction } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency, formatDate } from '../../utils/format';

interface SpendingTimelineProps {
  transactions: Transaction[];
}

export function SpendingTimeline({ transactions }: SpendingTimelineProps) {
  if (transactions.length === 0) {
    return (
      <Card header={<h3 className="text-sm font-semibold">Spending Timeline</h3>}>
        <div className="flex items-center justify-center h-48 text-sm text-text-muted">
          No spending data
        </div>
      </Card>
    );
  }

  // Build cumulative data
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  );
  let cumulative = 0;
  const data = sorted.map((tx) => {
    cumulative += tx.amount;
    return {
      date: formatDate(tx.releaseDate),
      amount: cumulative,
      label: formatCurrency(cumulative),
    };
  });

  return (
    <Card header={<h3 className="text-sm font-semibold">Spending Timeline</h3>}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v / 100 / 100000).toFixed(0)}L`} />
            <Tooltip
              formatter={(value: any) => [formatCurrency(value), 'Cumulative']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
