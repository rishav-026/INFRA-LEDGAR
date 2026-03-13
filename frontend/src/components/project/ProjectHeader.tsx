import type { Project } from '../../types';
import { StatusBadge, RiskBadge } from '../ui/Badge';
import { formatCurrency, formatDate } from '../../utils/format';
import { MapPin, Calendar, Share2, Building } from 'lucide-react';
import { useToastContext } from '../../context/ToastContext';

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const { addToast } = useToastContext();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('success', 'Project URL copied to clipboard');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-text-primary">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-text-secondary mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={project.status} />
          <RiskBadge level={project.riskLevel} />
          <button
            onClick={handleShare}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
            title="Copy link"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-text-secondary">
        <span className="flex items-center gap-1.5"><MapPin size={14} /> {project.location}</span>
        <span className="flex items-center gap-1.5"><Building size={14} /> {project.contractorName}</span>
        <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
        <span className="flex items-center gap-1.5">Budget: <strong>{formatCurrency(project.totalBudget)}</strong></span>
      </div>
    </div>
  );
}
