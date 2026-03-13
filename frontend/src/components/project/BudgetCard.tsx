import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Project } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency, percentage } from '../../utils/format';

interface BudgetCardProps {
  project: Project;
}

const COLORS = ['#3b82f6', '#e2e8f0'];

export function BudgetCard({ project }: BudgetCardProps) {
  const released = project.fundsReleased;
  const remaining = project.totalBudget - released;
  const pct = percentage(released, project.totalBudget);

  const data = [
    { name: 'Released', value: released },
    { name: 'Remaining', value: remaining },
  ];

  return (
    <Card header={<h3 className="text-sm font-semibold">Budget Breakdown</h3>}>
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => formatCurrency(value)}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-text-primary">{pct}%</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-brand-500" />
            <span className="text-text-secondary">Released:</span>
            <span className="font-medium">{formatCurrency(released)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-gray-200" />
            <span className="text-text-secondary">Remaining:</span>
            <span className="font-medium">{formatCurrency(remaining)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
