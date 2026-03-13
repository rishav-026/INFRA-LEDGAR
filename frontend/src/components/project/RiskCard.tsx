import type { Project } from '../../types';
import { Card } from '../ui/Card';
import { RiskBadge } from '../ui/Badge';
import type { AnalysisFeatures } from '../../types';

interface RiskCardProps {
  project: Project;
  features?: AnalysisFeatures | null;
}

const featureLabels: Record<keyof AnalysisFeatures, string> = {
  fundsReleasedPct: 'Funds Released',
  completionPct: 'Completion',
  proofCount: 'Work Proofs',
  daysElapsed: 'Days Elapsed',
  releaseFrequency: 'Release Freq.',
};

export function RiskCard({ project, features }: RiskCardProps) {
  return (
    <Card header={<h3 className="text-sm font-semibold">AI Risk Assessment</h3>}>
      {project.riskScore === null ? (
        <div className="flex flex-col items-center py-6 text-sm text-text-muted">
          <p>Not yet analyzed</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-text-primary">{project.riskScore.toFixed(2)}</span>
            <RiskBadge level={project.riskLevel} />
          </div>

          {features && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Features</p>
              <div className="space-y-1">
                {(Object.entries(features) as [keyof AnalysisFeatures, number][]).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-text-secondary">{featureLabels[key]}</span>
                    <span className="font-medium text-text-primary">
                      {key.includes('Pct') ? `${value}%` : value.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
