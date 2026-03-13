import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types';
import { Card } from '../ui/Card';
import { RiskBadge, StatusBadge } from '../ui/Badge';
import { formatCurrencyShort, percentage } from '../../utils/format';
import { MapPin, FileCheck } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const releasedPct = percentage(project.fundsReleased, project.totalBudget);
  const completionPct = Math.min(Math.max(project.completionPercentage || 0, 0), 100);

  return (
    <Card hoverable onClick={() => navigate(`/project/${project.id}`)}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">{project.name}</h3>
            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {project.location}
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        {/* Budget bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>{formatCurrencyShort(project.fundsReleased)} released</span>
            <span>{formatCurrencyShort(project.totalBudget)} total</span>
          </div>
          <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(releasedPct, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span>Completion</span>
            <span>{completionPct}%</span>
          </div>
          <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <RiskBadge level={project.riskLevel} />
          <span className="text-text-muted flex items-center gap-1">
            <FileCheck size={12} /> {project.proofCount} proofs
          </span>
        </div>
      </div>
    </Card>
  );
}
