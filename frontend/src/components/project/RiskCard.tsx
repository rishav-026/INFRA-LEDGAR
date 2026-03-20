import type { Project } from '../../types';
import { Card } from '../ui/Card';
import { RiskBadge } from '../ui/Badge';
import type { Analysis, AnalysisFeatures } from '../../types';

interface RiskCardProps {
  project: Project;
  features?: AnalysisFeatures | null;
  analysis?: Analysis | null;
}

const featureLabels: Record<keyof AnalysisFeatures, string> = {
  fundsReleasedPct: 'Funds Released',
  completionPct: 'Completion',
  budgetProgressGapPct: 'Budget-Progress Gap',
  proofCount: 'Work Proofs',
  daysElapsed: 'Days Elapsed',
  transactionCount: 'Transactions',
  releaseFrequency: 'Release Freq.',
  meanReleaseSizePct: 'Mean Release Size',
};

export function RiskCard({ project, features, analysis }: RiskCardProps) {
  const rawScore = analysis?.riskScore ?? project.riskScore;
  const displayScore = rawScore === null ? null : (rawScore <= 1 ? rawScore * 100 : rawScore);
  const displayLevel = analysis?.riskLevel ?? project.riskLevel;
  const displayAnomalies = analysis?.flaggedAnomalies || [];
  const displayFactors = analysis?.weightedFeatures || [];
  const insufficientData = analysis?.dataQuality === 'insufficient';

  return (
    <Card header={<h3 className="text-sm font-semibold">ML Risk Assessment (Explainable)</h3>}>
      {displayScore === null || !displayLevel ? (
        <div className="flex flex-col items-center py-6 text-sm text-text-muted">
          <p>Not yet analyzed</p>
        </div>
      ) : insufficientData ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold text-text-primary">Insufficient Data</span>
            <RiskBadge level="normal" />
          </div>
          <p className="text-xs text-text-muted">
            Risk score is deferred until meaningful project activity is available.
          </p>
          {analysis?.reasoning && <p className="text-xs text-text-secondary">{analysis.reasoning}</p>}
          <ul className="space-y-1 text-sm text-text-secondary list-disc pl-4">
            {displayAnomalies.map((note, idx) => (
              <li key={`${note}-${idx}`}>{note}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-text-primary">{displayScore.toFixed(1)}/100</span>
            <RiskBadge level={displayLevel} />
          </div>

          <p className="text-xs text-text-muted">Score logic: weighted factors + rule-based anomaly boosts.</p>
          {analysis?.confidence && (
            <p className="text-xs text-text-muted">Confidence: {(analysis.confidence * 100).toFixed(0)}%</p>
          )}
          {analysis?.reasoning && (
            <p className="text-xs text-text-secondary">{analysis.reasoning}</p>
          )}

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

          {displayFactors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Factor Contributions</p>
              <div className="space-y-2">
                {displayFactors.map((factor) => (
                  <div key={factor.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-secondary">{factor.label}</span>
                      <span className="font-medium text-text-primary">
                        {(factor.contribution * 100).toFixed(1)} pts
                      </span>
                    </div>
                    <div className="h-1.5 rounded bg-surface-secondary overflow-hidden">
                      <div
                        className="h-full bg-brand-500"
                        style={{ width: `${Math.round(factor.normalized * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayAnomalies.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Assessment Notes</p>
              <ul className="space-y-1 text-sm text-text-secondary list-disc pl-4">
                {displayAnomalies.map((note, idx) => (
                  <li key={`${note}-${idx}`}>{note}</li>
                ))}
              </ul>
              {typeof features?.budgetProgressGapPct === 'number' && (
                <p className="text-xs text-text-muted">Gap used in model: {features.budgetProgressGapPct.toFixed(1)}%</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
