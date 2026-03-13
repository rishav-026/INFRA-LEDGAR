import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Plus, AlertTriangle } from 'lucide-react';

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/projects/new')}>
        Create Project
      </Button>
      <Button variant="secondary" icon={<AlertTriangle size={16} />} onClick={() => navigate('/?status=flagged')}>
        View Flagged Projects
      </Button>
    </div>
  );
}
