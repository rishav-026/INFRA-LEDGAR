import { prisma } from '../server';

const ANALYSIS_INTERVAL_HOURS = Number(process.env.AI_CRON_INTERVAL_HOURS || 6);

let schedulerStarted = false;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type ModelInput = {
  fundsReleasedPct: number;
  completionPct: number;
  budgetProgressGapPct: number;
  proofCount: number;
  daysElapsed: number;
  transactionCount: number;
  releaseFrequency: number;
  meanReleaseSizePct: number;
  latestProofDescription?: string;
};

type WeightedFeature = {
  key:
    | 'budgetProgressGapPct'
    | 'fundsReleasedPct'
    | 'releaseFrequency'
    | 'proofAdequacy'
    | 'meanReleaseSizePct'
    | 'timeOverrunSignal';
  label: string;
  weight: number;
  normalized: number;
  contribution: number;
};

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

const runLocalRiskModel = (input: ModelInput) => {
  const hasInsufficientData = input.transactionCount === 0 && input.proofCount === 0;
  if (hasInsufficientData) {
    return {
      riskScore: 0,
      riskLevel: 'normal' as const,
      flaggedAnomalies: ['Insufficient activity data for reliable risk scoring'],
      confidence: 0.35,
      reasoning: 'No fund releases or proof uploads yet, so model confidence is low.',
      weightedFeatures: [] as WeightedFeature[],
      dataQuality: 'insufficient' as const,
    };
  }

  const proofAdequacy = clamp(input.proofCount / Math.max(input.transactionCount, 1), 0, 1);

  const normalized = {
    budgetProgressGapPct: clamp(input.budgetProgressGapPct / 100, 0, 1),
    fundsReleasedPct: clamp(input.fundsReleasedPct / 100, 0, 1),
    releaseFrequency: clamp(input.releaseFrequency / 2.5, 0, 1),
    proofAdequacy: clamp(1 - proofAdequacy, 0, 1),
    meanReleaseSizePct: clamp(input.meanReleaseSizePct / 100, 0, 1),
    timeOverrunSignal: clamp((input.daysElapsed - 180) / 180, 0, 1),
  };

  const weights = {
    budgetProgressGapPct: 0.34,
    fundsReleasedPct: 0.18,
    releaseFrequency: 0.15,
    proofAdequacy: 0.15,
    meanReleaseSizePct: 0.1,
    timeOverrunSignal: 0.08,
  };

  let linearScore = 0;
  const weightedFeatures: WeightedFeature[] = (Object.keys(weights) as Array<keyof typeof weights>).map((key) => {
    const contribution = normalized[key] * weights[key];
    linearScore += contribution;
    const labels: Record<WeightedFeature['key'], string> = {
      budgetProgressGapPct: 'Budget-vs-progress gap',
      fundsReleasedPct: 'Funds released ratio',
      releaseFrequency: 'Release frequency',
      proofAdequacy: 'Proof adequacy deficit',
      meanReleaseSizePct: 'Average release size',
      timeOverrunSignal: 'Schedule overrun signal',
    };
    return {
      key,
      label: labels[key],
      weight: weights[key],
      normalized: Number(normalized[key].toFixed(4)),
      contribution: Number(contribution.toFixed(4)),
    };
  });

  // Interaction boosts/penalties for deeper risk characterization.
  if (input.fundsReleasedPct >= 70 && input.completionPct <= 40) linearScore += 0.12;
  if (input.proofCount === 0 && input.fundsReleasedPct >= 45) linearScore += 0.08;
  if (input.releaseFrequency >= 1.2 && input.meanReleaseSizePct >= 18) linearScore += 0.06;
  if (input.completionPct >= input.fundsReleasedPct) linearScore -= 0.08;
  if (input.proofCount >= 4 && input.budgetProgressGapPct <= 10) linearScore -= 0.05;

  const riskScore = Number(clamp(sigmoid((linearScore - 0.45) * 5), 0.02, 0.98).toFixed(4));
  const riskLevel = riskScore >= 0.7 ? 'high' : riskScore >= 0.4 ? 'medium' : 'normal';

  const flaggedAnomalies: string[] = [];
  if (input.budgetProgressGapPct >= 25) {
    flaggedAnomalies.push('Spending is outpacing execution progress by a large margin');
  }
  if (input.proofCount === 0 && input.fundsReleasedPct >= 45) {
    flaggedAnomalies.push('No supporting proofs despite substantial released funds');
  }
  if (input.releaseFrequency >= 1.3) {
    flaggedAnomalies.push('Fund releases are unusually frequent relative to project age');
  }
  if (input.meanReleaseSizePct >= 25) {
    flaggedAnomalies.push('Single releases are large relative to total budget');
  }
  if (flaggedAnomalies.length === 0) {
    flaggedAnomalies.push('No material risk anomalies detected by local ML model');
  }

  const confidence = Number(
    clamp(0.55 + Math.min(input.transactionCount, 8) * 0.03 + Math.min(input.proofCount, 6) * 0.025, 0.55, 0.95).toFixed(2)
  );

  const reasoning =
    riskLevel === 'high'
      ? 'High risk due to sustained spending-progress mismatch with weak documentary support.'
      : riskLevel === 'medium'
        ? 'Moderate risk driven by one or more financial or documentation imbalance signals.'
        : 'Low risk as spending, progress, and documentary evidence appear relatively aligned.';

  return {
    riskScore,
    riskLevel,
    flaggedAnomalies,
    confidence,
    reasoning,
    weightedFeatures,
    dataQuality: 'sufficient' as const,
  };
};

export const aiService = {
  analyzeProject: async (projectId: string, opts?: { latestProofDescription?: string }) => {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        transactions: {
          select: {
            id: true,
            amount: true,
          },
        },
        proofs: {
          select: {
            id: true,
            description: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      throw new Error('Project not found for AI analysis');
    }

    const fundsReleasedPct = project.totalBudget > 0 ? project.fundsReleased / project.totalBudget : 0;
    const completionPct = clamp(project.completionPercentage / 100, 0, 1);
    const budgetProgressGapPct = Number(
      clamp((fundsReleasedPct - completionPct) * 100, 0, 100).toFixed(2)
    );
    const proofCount = project.proofs.length;
    const daysElapsed = Math.max(
      1,
      Math.floor((Date.now() - new Date(project.startDate).getTime()) / 86400000)
    );
    const releaseFrequency = project.transactions.length / Math.max(daysElapsed / 7, 1);
    const totalReleasedFromTx = project.transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
    const meanReleaseSizePct = project.totalBudget > 0
      ? Number((Math.min(1, (totalReleasedFromTx / Math.max(project.transactions.length, 1)) / project.totalBudget) * 100).toFixed(2))
      : 0;

    const latestProofDescription =
      opts?.latestProofDescription || project.proofs[0]?.description || '';

    const mlInput: ModelInput = {
      fundsReleasedPct: Number((fundsReleasedPct * 100).toFixed(2)),
      completionPct: Number((completionPct * 100).toFixed(2)),
      budgetProgressGapPct,
      proofCount,
      daysElapsed,
      transactionCount: project.transactions.length,
      releaseFrequency: Number(releaseFrequency.toFixed(2)),
      meanReleaseSizePct,
      latestProofDescription,
    };

    const modelOutput = runLocalRiskModel(mlInput);

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        riskScore: modelOutput.riskScore,
        riskLevel: modelOutput.riskLevel,
      },
      include: {
        transactions: { orderBy: { releaseDate: 'desc' } },
        proofs: { orderBy: { createdAt: 'desc' } },
        contractor: {
          select: { id: true, displayName: true, organization: true },
        },
      },
    });

    return {
      project: updated,
      analysis: {
        provider: 'local-ml',
        modelVersion: 'local-ml-risk-v2',
        confidence: modelOutput.confidence,
        riskScore: modelOutput.riskScore,
        riskLevel: modelOutput.riskLevel,
        flaggedAnomalies: modelOutput.flaggedAnomalies,
        reasoning: modelOutput.reasoning,
        weightedFeatures: modelOutput.weightedFeatures,
        dataQuality: modelOutput.dataQuality,
        features: {
          fundsReleasedPct: Number((fundsReleasedPct * 100).toFixed(2)),
          completionPct: Number((completionPct * 100).toFixed(2)),
          budgetProgressGapPct,
          proofCount,
          daysElapsed,
          transactionCount: project.transactions.length,
          releaseFrequency: Number(releaseFrequency.toFixed(2)),
          meanReleaseSizePct,
        },
      },
    };
  },

  startScheduler: () => {
    if (schedulerStarted) return;
    schedulerStarted = true;

    const intervalMs = Math.max(1, ANALYSIS_INTERVAL_HOURS) * 60 * 60 * 1000;

    const runBatch = async () => {
      try {
        const projects = await prisma.project.findMany({ select: { id: true } });
        for (const project of projects) {
          try {
            await aiService.analyzeProject(project.id);
          } catch (err) {
            console.error(`AI batch analysis failed for project ${project.id}:`, err);
          }
        }
      } catch (error) {
        console.error('AI scheduler batch run failed:', error);
      }
    };

    setInterval(() => {
      void runBatch();
    }, intervalMs);

    console.log(`🧠 AI scheduler started (interval: ${ANALYSIS_INTERVAL_HOURS}h)`);
  },

  /**
   * Asynchronously analyzes a proof and updates the project's risk score.
   * In a production system, this would be pushed to a queue (like BullMQ).
   */
  analyzeProofAsync: async (proofId: string, projectId: string, _description: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const analysis = await aiService.analyzeProject(projectId, {
        latestProofDescription: _description,
      });

      await prisma.proof.update({
        where: { id: proofId },
        data: {
          aiAnalysisCompleted: true,
          flaggedAnomalies: JSON.stringify(analysis.analysis.flaggedAnomalies || ['AI analysis completed']),
        },
      });

      console.log(
        `✅ [AI:${analysis.analysis.provider}] Analyzed proof ${proofId} for project ${projectId}. Score: ${analysis.analysis.riskScore}`
      );

    } catch (error) {
      console.error(`❌ [AI Engine] Failed to analyze proof ${proofId}:`, error);
      // We don't throw here to avoid crashing the node process, 
      // since this runs asynchronously outside the HTTP request.
    }
  }
};
