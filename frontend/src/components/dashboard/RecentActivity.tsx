import { useNavigate } from 'react-router-dom';
import type { ActivityItem } from '../../types';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import { formatTimeAgo } from '../../utils/format';
import { Badge } from '../ui/Badge';

interface RecentActivityProps {
  activities: ActivityItem[];
}

const actionVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  'Fund Released': 'success',
  'Proof Uploaded': 'info',
  'Risk Flagged': 'danger',
  'Project Created': 'default',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  const navigate = useNavigate();

  const columns = [
    { key: 'time', header: 'Time', render: (a: ActivityItem) => <span className="text-text-muted whitespace-nowrap">{formatTimeAgo(a.date)}</span>, className: 'w-24' },
    { key: 'action', header: 'Action', render: (a: ActivityItem) => <Badge variant={actionVariant[a.action] || 'default'}>{a.action}</Badge> },
    {
      key: 'project',
      header: 'Project',
      render: (a: ActivityItem) => (
        <button onClick={() => navigate(`/project/${a.projectId}`)} className="text-brand-600 hover:underline text-left cursor-pointer">
          {a.projectName}
        </button>
      ),
    },
    { key: 'details', header: 'Details', render: (a: ActivityItem) => <span className="text-text-secondary">{a.details}</span> },
  ];

  return (
    <Card header={<h3 className="text-sm font-semibold">Recent Activity</h3>} padding="none">
      <Table
        columns={columns}
        data={activities}
        keyExtractor={(a) => a.id}
        emptyMessage="No recent activity. Create your first project to get started."
      />
    </Card>
  );
}
