import type { Project } from '../../types';
import { ProjectCard } from '../project/ProjectCard';
import { EmptyState } from '../ui/EmptyState';
import { ShieldCheck } from 'lucide-react';

interface FlaggedProjectsProps {
  projects: Project[];
}

export function FlaggedProjects({ projects }: FlaggedProjectsProps) {
  const flagged = projects.filter((p) => p.riskLevel === 'high');

  if (flagged.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <EmptyState
          icon={<ShieldCheck size={32} className="text-green-500" />}
          title="No flagged projects"
          description="All projects are within normal risk parameters."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-red-700">
        ⚠ {flagged.length} project{flagged.length > 1 ? 's' : ''} require{flagged.length === 1 ? 's' : ''} review
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {flagged.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
